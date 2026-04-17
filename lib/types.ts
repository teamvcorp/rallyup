export interface User {
  _id?: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  roundUpPreference: 'half' | 'whole' // round to nearest $0.50 or $1.00
  autoPaymentEnabled: boolean
  stripeCustomerId?: string
  stripeIssuingCardId?: string
  plaidAccessToken?: string
  plaidItemId?: string
}

export interface PointsBalance {
  _id?: string
  userId: string
  balance: number // current points balance (1 point = $1)
  totalEarned: number // lifetime points earned
  totalSpent: number // lifetime points spent
  updatedAt: Date
}

export interface RoundUpTransaction {
  _id?: string
  userId: string
  originalAmount: number // e.g. $5.45
  roundedAmount: number // e.g. $6.00 (whole) or $5.50 (half)
  roundUpAmount: number // e.g. $0.55 or $0.05
  pointsEarned: number // same as roundUpAmount (1:1)
  plaidTransactionId: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface FinancingPlan {
  _id?: string
  userId: string
  itemDescription: string
  totalAmount: number
  pointsUsedAsDownPayment: number // up to 25% of stored points
  financedAmount: number // totalAmount - pointsUsedAsDownPayment
  installments: 4 | 8 | 12
  installmentAmount: number // financedAmount / installments
  paidInstallments: number
  status: 'active' | 'completed' | 'defaulted'
  stripeVirtualCardChargeId?: string
  createdAt: Date
  nextPaymentDate: Date
}

export interface FinancingPayment {
  _id?: string
  financingPlanId: string
  userId: string
  amount: number
  installmentNumber: number
  status: 'pending' | 'completed' | 'failed'
  stripePaymentIntentId?: string
  createdAt: Date
}

export interface LinkedAccount {
  _id?: string
  userId: string
  provider: 'stripe' | 'plaid'
  accountName: string
  accountType: 'credit' | 'checking' | 'savings'
  lastFour: string
  institutionName?: string
  plaidAccountId?: string
  stripePaymentMethodId?: string
  isActive: boolean
  createdAt: Date
}
