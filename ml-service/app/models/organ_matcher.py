from app.config import Config

class OrganMatcher:
    def __init__(self):
        self.weights = Config.COMPATIBILITY_WEIGHTS
        self.blood_compatibility = {
            'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
            'O+': ['O+', 'A+', 'B+', 'AB+'],
            'A-': ['A-', 'A+', 'AB-', 'AB+'],
            'A+': ['A+', 'AB+'],
            'B-': ['B-', 'B+', 'AB-', 'AB+'],
            'B+': ['B+', 'AB+'],
            'AB-': ['AB-', 'AB+'],
            'AB+': ['AB+']
        }
    
    def calculate_compatibility(self, donor, recipient):
        """
        Calculate compatibility score between donor and recipient
        """
        # Blood type compatibility (40%)
        blood_score = self._calculate_blood_compatibility(
            donor.get('bloodType', ''),
            recipient.get('bloodType', '')
        )
        
        # Tissue match (30%)
        tissue_score = self._calculate_tissue_match(
            donor.get('tissueType', ''),
            recipient.get('tissueType', '')
        )
        
        # Age compatibility (20%)
        age_score = self._calculate_age_compatibility(
            donor.get('age', 0),
            recipient.get('age', 0)
        )
        
        # Urgency factor (10%)
        urgency_score = recipient.get('urgencyScore', 50)
        
        # Calculate weighted total score
        total_score = (
            blood_score * self.weights['blood_type'] +
            tissue_score * self.weights['tissue_match'] +
            age_score * self.weights['age_compatibility'] +
            urgency_score * self.weights['urgency']
        )
        
        return {
            'score': round(total_score, 2),
            'factors': {
                'bloodTypeMatch': round(blood_score, 2),
                'tissueMatch': round(tissue_score, 2),
                'ageCompatibility': round(age_score, 2),
                'urgencyFactor': round(urgency_score, 2)
            },
            'recommendation': self._get_recommendation(total_score)
        }
    
    def _calculate_blood_compatibility(self, donor_blood, recipient_blood):
        """
        Calculate blood type compatibility score (0-100)
        """
        if not donor_blood or not recipient_blood:
            return 0
        
        # Perfect match
        if donor_blood == recipient_blood:
            return 100
        
        # Compatible match
        if donor_blood in self.blood_compatibility:
            if recipient_blood in self.blood_compatibility[donor_blood]:
                return 80
        
        # Incompatible
        return 0
    
    def _calculate_tissue_match(self, donor_tissue, recipient_tissue):
        """
        Calculate HLA tissue match score (0-100)
        Simple implementation - in production, use complex HLA matching
        """
        if not donor_tissue or not recipient_tissue:
            return 50  # Unknown, assume moderate match
        
        # Simple string similarity for demonstration
        # In production, implement proper HLA antigen matching
        donor_antigens = set(donor_tissue.split(','))
        recipient_antigens = set(recipient_tissue.split(','))
        
        if donor_antigens and recipient_antigens:
            common = donor_antigens & recipient_antigens
            total = donor_antigens | recipient_antigens
            similarity = len(common) / len(total) if total else 0
            return similarity * 100
        
        return 50
    
    def _calculate_age_compatibility(self, donor_age, recipient_age):
        """
        Calculate age compatibility score (0-100)
        Closer ages generally indicate better compatibility
        """
        if not donor_age or not recipient_age:
            return 50
        
        age_diff = abs(donor_age - recipient_age)
        
        # Perfect match within 5 years
        if age_diff <= 5:
            return 100
        # Good match within 10 years
        elif age_diff <= 10:
            return 90
        # Moderate match within 15 years
        elif age_diff <= 15:
            return 75
        # Acceptable match within 20 years
        elif age_diff <= 20:
            return 60
        # Poor match beyond 20 years
        else:
            return max(40 - (age_diff - 20), 20)
    
    def _get_recommendation(self, score):
        """
        Get recommendation based on compatibility score
        """
        if score >= 85:
            return "Excellent match - Highly recommended for transplant"
        elif score >= 70:
            return "Good match - Recommended for transplant"
        elif score >= 55:
            return "Moderate match - Consider with careful evaluation"
        elif score >= 40:
            return "Fair match - Requires detailed medical assessment"
        else:
            return "Poor match - Not recommended without special circumstances"
    
    def find_best_match(self, recipient, donors):
        """
        Find the best donor match from a list of donors
        """
        matches = []
        
        for donor in donors:
            compatibility = self.calculate_compatibility(donor, recipient)
            matches.append({
                'donor': donor,
                'compatibility': compatibility
            })
        
        # Sort by score (highest first)
        matches.sort(key=lambda x: x['compatibility']['score'], reverse=True)
        
        return {
            'bestMatch': matches[0] if matches else None,
            'allMatches': matches
        }
