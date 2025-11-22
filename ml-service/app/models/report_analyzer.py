import re
from app.config import Config

class ReportAnalyzer:
    def __init__(self):
        self.reference_ranges = Config.REFERENCE_RANGES
    
    def analyze_from_text(self, text):
        """
        Analyze health metrics from extracted text
        """
        # Extract common health metrics from text
        metrics = self._extract_metrics_from_text(text)
        
        # Evaluate metrics
        return self.evaluate_metrics(metrics)
    
    def analyze_from_metrics(self, metrics_data):
        """
        Analyze pre-structured health metrics
        """
        return self.evaluate_metrics(metrics_data)
    
    def evaluate_metrics(self, metrics):
        """
        Evaluate health metrics against reference ranges
        """
        analyzed_metrics = []
        abnormal_count = 0
        
        for metric_name, value in metrics.items():
            if metric_name in self.reference_ranges:
                ref_range = self.reference_ranges[metric_name]
                
                is_normal = ref_range['min'] <= value <= ref_range['max']
                status = 'normal' if is_normal else 'abnormal'
                
                if not is_normal:
                    abnormal_count += 1
                
                analyzed_metrics.append({
                    'name': metric_name.replace('_', ' ').title(),
                    'value': value,
                    'unit': ref_range['unit'],
                    'normalRange': {
                        'min': ref_range['min'],
                        'max': ref_range['max']
                    },
                    'status': status
                })
        
        # Determine overall risk
        total_metrics = len(analyzed_metrics)
        if total_metrics == 0:
            overall_risk = 'low'
        else:
            abnormal_ratio = abnormal_count / total_metrics
            if abnormal_ratio > 0.5:
                overall_risk = 'high'
            elif abnormal_ratio > 0.25:
                overall_risk = 'medium'
            else:
                overall_risk = 'low'
        
        # Generate recommendations
        recommendations = self._generate_recommendations(analyzed_metrics, overall_risk)
        
        return {
            'metrics': analyzed_metrics,
            'overallRisk': overall_risk,
            'recommendations': recommendations
        }
    
    def _extract_metrics_from_text(self, text):
        """
        Extract numerical health metrics from text using regex
        """
        metrics = {}
        
        # Hemoglobin patterns
        hemoglobin_pattern = r'hemoglobin[:\s]+(\d+\.?\d*)'
        match = re.search(hemoglobin_pattern, text, re.IGNORECASE)
        if match:
            metrics['hemoglobin'] = float(match.group(1))
        
        # Glucose patterns
        glucose_pattern = r'glucose[:\s]+(\d+\.?\d*)'
        match = re.search(glucose_pattern, text, re.IGNORECASE)
        if match:
            metrics['glucose'] = float(match.group(1))
        
        # Cholesterol patterns
        cholesterol_pattern = r'cholesterol[:\s]+(\d+\.?\d*)'
        match = re.search(cholesterol_pattern, text, re.IGNORECASE)
        if match:
            metrics['cholesterol'] = float(match.group(1))
        
        # Blood pressure patterns
        bp_pattern = r'blood\s+pressure[:\s]+(\d+)/(\d+)'
        match = re.search(bp_pattern, text, re.IGNORECASE)
        if match:
            metrics['blood_pressure_systolic'] = int(match.group(1))
            metrics['blood_pressure_diastolic'] = int(match.group(2))
        
        return metrics
    
    def _generate_recommendations(self, metrics, risk_level):
        """
        Generate health recommendations based on analysis
        """
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append("Consult with your healthcare provider immediately")
            recommendations.append("Schedule a comprehensive health checkup")
        elif risk_level == 'medium':
            recommendations.append("Monitor these metrics regularly")
            recommendations.append("Consider lifestyle modifications")
        else:
            recommendations.append("Maintain a healthy lifestyle")
            recommendations.append("Continue regular health screenings")
        
        # Specific recommendations based on abnormal metrics
        for metric in metrics:
            if metric['status'] == 'abnormal':
                metric_name = metric['name'].lower()
                
                if 'hemoglobin' in metric_name:
                    recommendations.append("Increase iron-rich foods in your diet")
                elif 'glucose' in metric_name:
                    recommendations.append("Monitor blood sugar levels and consult about diabetes management")
                elif 'cholesterol' in metric_name:
                    recommendations.append("Consider dietary changes to manage cholesterol levels")
                elif 'blood pressure' in metric_name:
                    recommendations.append("Monitor blood pressure regularly and reduce sodium intake")
        
        return list(set(recommendations))  # Remove duplicates
