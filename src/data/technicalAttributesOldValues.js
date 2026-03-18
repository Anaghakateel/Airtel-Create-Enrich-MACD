/**
 * Old values for Technical Attributes fields (Compare with Asset).
 * Used by Agentforce when user asks "old value of [field]".
 */
export const TECHNICAL_ATTRIBUTES_OLD_VALUES = {
  'Customer Needed By Date': '15/04/2026',
  'Disconnection SR Number': 'SR-001234',
  'Disconnection LSI Number': 'LSI-789012',
  'Customer PM First Name': 'John',
  'Customer PM Last Name': 'Doe',
  'Customer PM Phone': '9876543210',
  'Customer PM Email': 'john.doe@example.com',
  'Reason for Zero Value Order': 'N/A',
  'Interface': 'Gigabit',
  'Site Readiness Status': 'Ready',
  'Handover Type': 'Previous value',
  'Routing Type': 'Previous value',
  'Customer Link Type': 'Previous value',
  'RTBH': 'Previous value',
  'BGP Prefix Limit': 'Previous value',
  'Likely Date of Site Readiness': 'Previous value',
  'SNMP version': 'Previous value',
  'Username': 'Previous value',
  'Groupname': 'Previous value',
  'Privacy / Encryption Type': 'Previous value',
  'Privacy / Encryption Password': 'Previous value',
  'DDoS Type': 'Previous value',
  'Customer Port Type': 'Previous value',
  'Access POP NW Loc Code': 'Previous value',
  'BTS Address': 'Previous value',
  'BTS NW Loc Code': 'Previous value',
  'CVLAN': 'Previous value',
  'Customer NW Loc Code': 'Previous value',
  'LNSPopCode': 'Previous value',
  'Network Element': 'Previous value',
  'RSU NW Loc Code': 'Previous value',
  'Customer AS Number': 'Previous value',
  'Remove Private AS': 'Previous value',
  'Peering Type': 'Previous value',
  'BGP Input Type': 'Previous value',
  'As Set': 'Previous value',
  'Routing Table': 'Previous value',
  'BGP Password': 'Previous value',
  'AS Override': 'Previous value',
  'BGP Dampening': 'Previous value',
  'BGP Timers': 'Previous value',
  'Keepalive': 'Previous value',
  'bgp-Replace AS': 'Previous value',
  'SOO': 'Previous value',
  'Default Originate': 'Previous value',
  'BGP Session Per Link': 'Previous value',
  'Airtel Loopback IP': 'Previous value',
  'Loopback IPv4 with Subnet M': 'Previous value',
  'Loopback IPv4': 'Previous value',
  'Add LAN IPv4': 'Previous value',
  'Delete LAN IPv4': 'Previous value',
  'LAN IPv4 Subnet Mask': 'Previous value',
  'Is Additional IP Block?': 'Previous value',
  'LAN IPv4': 'Previous value',
  'WAN IPv4 CE Subnet Mask': 'Previous value',
  'WAN IPv4 PE Subnet Mask': 'Previous value',
  'WAN IPv4 CE': 'Previous value',
  'WAN IPv4 PE': 'Previous value',
  'WAN IPv4 Subnet Mask': 'Previous value',
  'WAN IPv4 Pool': 'Previous value',
  'WAN IPv4 Pool Subnet': 'Previous value',
}

function normalizeForMatch(str) {
  return (str || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function getOldValueForField(fieldQuery) {
  if (!fieldQuery || typeof fieldQuery !== 'string') return null
  const q = normalizeForMatch(fieldQuery)
  if (!q) return null
  for (const [label, value] of Object.entries(TECHNICAL_ATTRIBUTES_OLD_VALUES)) {
    const normalizedLabel = normalizeForMatch(label)
    if (normalizedLabel.includes(q) || q.includes(normalizedLabel)) return { label, value }
  }
  return null
}
