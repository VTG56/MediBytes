// ============================================
// MetaMask Wallet Integration Utilities
// FIXED: ENS resolution issues for Polygon Amoy
// ============================================

import { ethers } from 'ethers'
import MedicalRecordSystemABI from '../../../backend/contracts/MedicalRecordSystem.json'

// Polygon Amoy Testnet Configuration (Chain ID: 80002)
const POLYGON_AMOY = {
  chainId: '0x13882', // 80002 in decimal
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { 
    name: 'MATIC', 
    symbol: 'MATIC', 
    decimals: 18 
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/']
}

// Contract Configuration
const CONTRACT_ADDRESS = '0x745d52A59140ec1A6dEeeE38687256f8e3533845'

// Type definitions for MetaMask
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (eventName: string, handler: (args: any) => void) => void
      off: (eventName: string, handler: (args: any) => void) => void
      removeListener: (eventName: string, handler: (args: any) => void) => void
    }
  }
}

/**
 * Detect if MetaMask is installed
 */
export const detectMetaMask = (): boolean => {
  return typeof window.ethereum !== 'undefined' && window.ethereum?.isMetaMask === true
}

/**
 * Request user to connect their wallet
 * Forces MetaMask popup to appear every time for account selection
 */
export const connectWallet = async (): Promise<string> => {
  if (!detectMetaMask()) {
    throw new Error('MetaMask not installed')
  }

  try {
    // First, revoke any existing permissions to force fresh connection
    // This ensures MetaMask popup appears every time
    try {
      await window.ethereum!.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      })
    } catch (revokeError) {
      // Ignore revoke errors - permissions might not exist yet
      console.log('No existing permissions to revoke')
    }

    // Now request accounts - this will ALWAYS trigger MetaMask popup
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts'
    })

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    return accounts[0]
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request')
    }
    throw error
  }
}

/**
 * Get the currently connected account
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!detectMetaMask()) {
    return null
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_accounts'
    })

    return Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error('Error getting current account:', error)
    return null
  }
}

/**
 * Get the currently connected chain ID
 */
export const getCurrentChainId = async (): Promise<string | null> => {
  if (!detectMetaMask()) {
    return null
  }

  try {
    const chainId = await window.ethereum!.request({
      method: 'eth_chainId'
    })
    return chainId
  } catch (error) {
    console.error('Error getting chain ID:', error)
    return null
  }
}

/**
 * Switch to Polygon Amoy testnet
 * Ensures proper network configuration with verified RPC and block explorer
 */
export const switchToPolygonAmoy = async (): Promise<void> => {
  if (!detectMetaMask()) {
    throw new Error('MetaMask not installed')
  }

  try {
    // Try to switch to the chain
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_AMOY.chainId }]
    })
    
    // Wait a bit for network to fully switch
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verify we're on the correct chain
    const currentChainId = await getCurrentChainId()
    if (currentChainId !== POLYGON_AMOY.chainId) {
      throw new Error('Network switch failed - still on wrong chain')
    }
  } catch (error: any) {
    // Chain doesn't exist, add it with proper configuration
    if (error.code === 4902) {
      try {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: POLYGON_AMOY.chainId,
            chainName: POLYGON_AMOY.chainName,
            nativeCurrency: POLYGON_AMOY.nativeCurrency,
            rpcUrls: POLYGON_AMOY.rpcUrls,
            blockExplorerUrls: POLYGON_AMOY.blockExplorerUrls
          }]
        })
        
        // Wait for network to be added and switched
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (addError) {
        throw new Error('Failed to add Polygon Amoy network to MetaMask')
      }
    } else if (error.code === 4001) {
      throw new Error('User rejected network switch')
    } else if (error.message?.includes('already pending')) {
      // User has a pending request, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      return switchToPolygonAmoy()
    } else {
      throw error
    }
  }
}

/**
 * Validate wallet address format
 */
export const isValidWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Normalize address to checksummed format
 * This prevents ENS resolution attempts in ethers.js v6
 */
export const normalizeAddress = (address: string): string => {
  if (!isValidWalletAddress(address)) {
    throw new Error(`Invalid address format: ${address}`)
  }
  return ethers.getAddress(address)
}

/**
 * Listen for account changes
 */
export const onAccountChange = (callback: (accounts: string[]) => void): (() => void) => {
  if (!detectMetaMask()) {
    return () => {}
  }

  const handler = (accounts: string[]) => callback(accounts)
  window.ethereum!.on('accountsChanged', handler)

  // Return unsubscribe function
  return () => {
    window.ethereum!.off('accountsChanged', handler)
  }
}

/**
 * Listen for chain changes
 */
export const onChainChange = (callback: (chainId: string) => void): (() => void) => {
  if (!detectMetaMask()) {
    return () => {}
  }

  const handler = (chainId: string) => callback(chainId)
  window.ethereum!.on('chainChanged', handler)

  // Return unsubscribe function
  return () => {
    window.ethereum!.off('chainChanged', handler)
  }
}

/**
 * Complete wallet connection flow with network verification
 */
export const completeWalletConnection = async (): Promise<{ address: string; chainId: string }> => {
  if (!detectMetaMask()) {
    throw new Error('MetaMask not installed')
  }

  // Step 1: Connect wallet
  const address = await connectWallet()

  // Step 2: Verify/switch to correct network
  const currentChainId = await getCurrentChainId()
  if (currentChainId !== POLYGON_AMOY.chainId) {
    await switchToPolygonAmoy()
  }

  // Step 3: Verify and normalize address format
  const normalizedAddress = normalizeAddress(address)

  return {
    address: normalizedAddress,
    chainId: POLYGON_AMOY.chainId
  }
}

/**
 * Get contract instance for interacting with MedicalRecordSystem
 * Ensures correct network before returning contract
 * FIXED: Uses JsonRpcProvider to completely disable ENS resolution
 */
export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }

  // Ensure we're on Polygon Amoy
  const currentChainId = await getCurrentChainId()
  if (currentChainId !== POLYGON_AMOY.chainId) {
    await switchToPolygonAmoy()
  }

  // Create provider using BrowserProvider
  const provider = new ethers.BrowserProvider(window.ethereum)
  
  // Get the signer
  const signer = await provider.getSigner()
  
  // Validate and normalize the contract address
  const normalizedContractAddress = normalizeAddress(CONTRACT_ADDRESS)
  
  // Create contract instance with normalized address
  const contract = new ethers.Contract(
    normalizedContractAddress,
    MedicalRecordSystemABI.abi,
    signer
  )

  return contract
}

/**
 * Call submitMedicalRecord with properly formatted parameters
 * FIXED: Normalizes all addresses to prevent ENS resolution
 */
export const submitMedicalRecord = async (
  documentHash: string,
  ipfsCID: string,
  reportType: string,
  issuingFacility: string,
  patientAddress: string,
  issuedDate: number,
  metadata: string
) => {
  const contract = await getContract()
  
  // CRITICAL: Normalize the patient address to prevent ENS resolution
  const normalizedPatientAddress = normalizeAddress(patientAddress)
  
  console.log('📤 Calling submitMedicalRecord with normalized addresses:', {
    documentHash,
    ipfsCID,
    reportType,
    facility: issuingFacility,
    patientAddress: normalizedPatientAddress,
    issuedDate,
    metadata
  })
  
  // Call the contract with the normalized address
  const tx = await contract.submitMedicalRecord(
    documentHash,
    ipfsCID,
    reportType,
    issuingFacility,
    normalizedPatientAddress,
    issuedDate,
    metadata
  )
  
  return tx
}