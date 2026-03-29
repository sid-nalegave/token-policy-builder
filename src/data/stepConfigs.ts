import type { StepConfig } from '@/types/steps'
import type { PolicyInputs } from '@/engine/types'

const isM2M = (inputs: PolicyInputs) => inputs.appType === 'm2m'

export const STEP_CONFIGS: StepConfig[] = [
  {
    id: 'appType',
    label: 'App type',
    question: 'What type of application is this?',
    tooltip:
      'The runtime architecture of the application. Determines client type (public vs confidential), available grant flows, and token storage constraints.',
    options: [
      {
        value: 'spa',
        label: 'SPA',
        description: 'Single-page application running in the browser.',
      },
      {
        value: 'server',
        label: 'Server-rendered',
        description: 'Server-side application with a confidential client.',
      },
      {
        value: 'mobile',
        label: 'Mobile (native)',
        description: 'Native mobile app using authorization code + PKCE.',
      },
      {
        value: 'm2m',
        label: 'M2M',
        description:
          'Machine-to-machine. No user interaction — client credentials grant.',
      },
    ],
    skippable: () => false,
    skipReason: '',
  },
  {
    id: 'userPopulation',
    label: 'User population',
    question: 'Who authenticates with this application?',
    tooltip:
      'Who authenticates with this application. Affects session duration expectations, re-auth tolerance, and compliance applicability.',
    options: [
      {
        value: 'employees',
        label: 'Employees',
        description: 'Internal workforce behind SSO.',
      },
      {
        value: 'consumers',
        label: 'Consumers',
        description: 'End-users on personal devices.',
      },
      {
        value: 'partners',
        label: 'Partners',
        description: 'External B2B users with federated identity.',
      },
    ],
    skippable: isM2M,
    skipReason: 'Not applicable for machine-to-machine flows',
  },
  {
    id: 'sensitivityTier',
    label: 'Sensitivity tier',
    question: 'How sensitive is the data this app accesses or processes?',
    tooltip:
      'Drives access token lifetime, re-authentication frequency, and refresh token rotation policy. High-sensitivity tiers tighten all three — low gives more flexibility to balance user friction.',
    options: [
      {
        value: 'low',
        label: 'Low',
        description: 'General productivity. No regulated data. No PII.',
        inlineDescription: 'General productivity. No regulated data. No PII.',
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Business-sensitive data or PII.',
        inlineDescription:
          'Business-sensitive data or PII. Not subject to strict compliance requirements.',
      },
      {
        value: 'high',
        label: 'High',
        description: 'Financial data, PHI, privileged access, or FedRAMP/HIPAA systems.',
        inlineDescription:
          'Financial data, PHI, privileged access, or systems subject to FedRAMP or HIPAA.',
      },
    ],
    skippable: () => false,
    skipReason: '',
  },
  {
    id: 'complianceFramework',
    label: 'Compliance framework',
    question: 'Which regulatory or certification framework applies?',
    tooltip:
      'The regulatory or certification framework your application must satisfy. Drives specific timeout values, token storage constraints, and required controls.',
    options: [
      {
        value: 'none',
        label: 'None',
        description: 'No specific compliance requirement.',
      },
      {
        value: 'soc2',
        label: 'SOC 2',
        description: 'SOC 2 Type II audit requirements.',
      },
      {
        value: 'hipaa',
        label: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act.',
      },
      {
        value: 'fedramp-moderate',
        label: 'FedRAMP Moderate',
        description: 'FedRAMP Moderate baseline controls.',
      },
      {
        value: 'fedramp-high',
        label: 'FedRAMP High',
        description: 'FedRAMP High baseline controls.',
      },
    ],
    skippable: () => false,
    skipReason: '',
  },
  {
    id: 'refreshTokenUsage',
    label: 'Refresh token usage',
    question: 'Will this application use refresh tokens?',
    tooltip:
      'Refresh tokens allow clients to obtain new access tokens without re-authenticating. Select Yes if your app needs sessions longer than the access token lifetime or runs background operations. SPAs using authorization code + PKCE typically use refresh tokens.',
    options: [
      {
        value: 'yes',
        label: 'Yes',
        description:
          'Refresh tokens issued. Sessions can outlive the access token.',
      },
      {
        value: 'no',
        label: 'No',
        description:
          'No refresh tokens. User re-authenticates when the access token expires.',
      },
    ],
    skippable: isM2M,
    skipReason: 'Not applicable for machine-to-machine flows',
  },
  {
    id: 'idleBehavior',
    label: 'Idle session behavior',
    question: 'How should idle sessions behave?',
    tooltip:
      'Sliding window resets the inactivity timer on each user action — the session stays alive as long as the user is active. Fixed expiry terminates the session at a hard deadline regardless of activity. NIST 800-63B Rev 4 mandates an absolute session limit at AAL2 (SHALL) and recommends an inactivity timeout (SHOULD) — they are complementary, not alternatives. HIPAA automatic logoff is addressable, not required, and specifies no numeric value.',
    options: [
      {
        value: 'sliding',
        label: 'Sliding window',
        description:
          'Inactivity timer resets on each user action.',
      },
      {
        value: 'fixed',
        label: 'Fixed expiry',
        description:
          'Session terminates at a hard deadline regardless of activity.',
      },
    ],
    skippable: isM2M,
    skipReason: 'Not applicable for machine-to-machine flows',
  },
  {
    id: 'tokenBinding',
    label: 'Token binding',
    question: 'What sender-constraining mechanism will you use?',
    tooltip:
      'Sender-constrained tokens bind the token cryptographically to the client that requested it, preventing use by another party even if stolen. Unbounded bearer tokens are valid for any presenter.',
    options: [
      {
        value: 'none',
        label: 'None',
        description:
          'Standard bearer token. Valid for any presenter. Lifetime recommendations are conservative.',
      },
      {
        value: 'dpop',
        label: 'DPoP',
        description:
          'RFC 9449. Token bound to a client-held key pair. Does not justify longer lifetimes unless server-provided nonces are in use.',
      },
      {
        value: 'mtls',
        label: 'mTLS',
        description:
          'RFC 8705. Token bound to the client certificate. Strongest binding — standards are silent on lifetime extension.',
      },
    ],
    skippable: () => false,
    skipReason: '',
  },
]
