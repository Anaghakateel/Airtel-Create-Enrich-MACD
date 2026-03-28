/**
 * Configure Technical Attributes form - sections:
 * Account & Order Details, Internet, Primary Link, Connectivity IP Block, Connectivity LAN IP, Connectivity WAN IP
 */
import { useState, useEffect, useRef } from 'react'

const SELECT_OPTION = 'Select an Option'

// Dropdown options from ConfigurationCartContent + extensions for all fields
const OPTIONS = {
  orderType: ['New', 'Modify', 'Disconnect'],
  product: ['Primary Link', 'Secondary Link', 'Enterprise ILL'],
  accessBandwidth: ['1 Mbps', '2 Mbps', '4 Mbps', '5 Mbps', '10 Mbps', '20 Mbps', '50 Mbps', '100 Mbps', '200 Mbps', '500 Mbps', '1 Gbps'],
  portBandwidth: ['1 Mbps', '2 Mbps', '4 Mbps', '5 Mbps', '10 Mbps', '20 Mbps', '50 Mbps', '100 Mbps', '200 Mbps', '500 Mbps', '1 Gbps'],
  contractTerm: ['6', '12', '24', '36', '48', '60'],
  media: ['FTTH', 'Fiber', 'Fiber Optics', 'Copper', 'Ethernet', 'Wireless', 'DSL'],
  pop: ['Single POP', 'Dual POP', 'Multi POP'],
  lastMile: ['Single Last Mile', 'Dual Last Mile', 'Multi Last Mile'],
  redundancy: ['No', 'Yes'],
  serviceType: ['Unmanaged', 'Managed', 'Co-Managed', 'Managed SD-WAN', 'DIY'],
  cpe: ['Select', 'CPE-A', 'CPE-B', 'CPE-C', 'Customer Provided', 'Not Required'],
  ipRequired: ['None', 'IPv4', 'IPv6', 'IPv4 & IPv6'],
  ddosRequired: ['No', 'Yes'],
  crossConnectRequired: ['No', 'Yes'],
  uptimeSLA: ['99%', '99.5%', '99.9%'],
  handoverType: ['Non NNI', 'NNI'],
  peeringType: ['Loopback', 'Physical', 'Other'],
  routingTable: ['Default BGP', 'Custom'],
  asOverride: ['Yes', 'No'],
  bgpDampening: ['No', 'Yes'],
  defaultOriginate: ['No', 'Yes'],
  bgpSessionPerLink: ['1', '2', '4'],
  sendCommunityEbgp: ['No', 'Yes'],
  bgpLog: ['No', 'Yes'],
  bfd: ['No', 'Yes'],
  fastDetect: ['No', 'Yes'],
  multiplier: ['1', '2', '3', '5'],
  ddosType: ['No', 'Yes'],
  sfpType: ['Single Mode', 'Multi Mode'],
  ispTaggings: ['Y', 'N'],
  subProductName: ['Enterprise ILL', 'Enterprise DIA', 'Other'],
  ipType: ['IPv4', 'IPv6'],
  lanSubnetMask: ['/24', '/25', '/26', '/27', '/28', '/29', '/30'],
  wanSubnetMask: ['/24', '/25', '/26', '/27', '/28', '/29', '/30', SELECT_OPTION],
  // For "Select an Option" placeholder fields - add relevant options
  interface: [SELECT_OPTION, 'Gigabit', '10G', '100G', 'SFP'],
  authenticationType: [SELECT_OPTION, 'None', 'RADIUS', 'TACACS'],
  relogReason: [SELECT_OPTION, 'Upgrade', 'Downgrade', 'Migration'],
  reasonForZeroValue: [SELECT_OPTION, 'N/A', 'Credit', 'Waiver'],
  siteReadinessStatus: [SELECT_OPTION, 'Ready', 'Pending', 'Not Started'],
  removePrivateAS: [SELECT_OPTION, 'Yes', 'No'],
  bgpInputType: [SELECT_OPTION, 'Manual', 'Auto'],
  bgpTimers: [SELECT_OPTION, 'Default', 'Custom'],
  rtbh: [SELECT_OPTION, 'Yes', 'No'],
  minimumInterval: [SELECT_OPTION, '100', '200', '500'],
  snmpVersion: [SELECT_OPTION, 'v2', 'v3'],
  customerPortType: [SELECT_OPTION, 'Copper', 'Fiber', 'SFP'],
  routingProtocol: [SELECT_OPTION, 'BGP', 'Static', 'OSPF', 'ISIS'],
  routingType: ['Static', 'Private BGP', 'Static with Public BGP', 'Public BGP', 'Static with Private BGP', 'None'],
}

const CONFIDENCE_LEVEL_PROFILES = {
  'All Confidence Levels': {
    code: 'ALL',
    dates: {
      'Customer Needed By Date': '2026-04-20',
      'Likely Date of Site Readiness': '2026-04-28',
    },
    selects: {
      'Reason for Zero Value Order': 'N/A',
      'Interface': 'Gigabit',
      'Site Readiness Status': 'Ready',
      'Routing Type': 'Static',
      'Handover Type': 'Non NNI',
      'RTBH': 'No',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'No',
      'BGP Log': 'No',
      'BFD': 'No',
      'Fast Detect': 'No',
      'Multiplier': '3',
      'Minimum Interval': '200',
    },
    texts: {
      'Disconnection SR Number': 'SR-ALL-1024',
      'Disconnection LSI Number': 'LSI-ALL-44551',
      'Customer PM First Name': 'Asha',
      'Customer PM Last Name': 'Nair',
      'Customer PM Phone': '9876543210',
      'Customer PM Email': 'asha.nair@hdfcbank.com',
      'BGP Prefix Limit': '1000',
      Username: 'snmp_all_user',
      Groupname: 'netops',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'Enc@12345',
      'Access POP NW Loc Code': 'DEL-POP-01',
      'BTS Address': 'Connaught Place, New Delhi',
      'BTS NW Loc Code': 'DEL-BTS-01',
      CVLAN: '120',
      'Customer NW Loc Code': 'HDFC-DEL-01',
      'ISP MPLS POP NW Loc Code': 'MPLS-DEL-01',
      LNSPopCode: 'LNS-DEL-01',
      'Network Element': 'NE-DEL-EDGE-01',
      'RSU NW Loc Code': 'RSU-DEL-01',
    },
  },
  'Below 30%': {
    code: 'L30',
    dates: {
      'Customer Needed By Date': '2026-06-18',
      'Likely Date of Site Readiness': '2026-07-05',
    },
    selects: {
      'Reason for Zero Value Order': 'Credit',
      'Interface': 'SFP',
      'Site Readiness Status': 'Not Started',
      'Routing Type': 'Private BGP',
      'Handover Type': 'NNI',
      'Peering Type': 'Physical',
      'BGP Input Type': 'Manual',
      'Remove Private AS': 'Yes',
      'AS Override': 'No',
      'BGP Dampening': 'Yes',
      'BGP Timers': 'Custom',
      'bgp-Replace AS': 'Yes',
      'Default Originate': 'Yes',
      'BGP Session Per Link': '2',
      'Send Community eBGP': 'Yes',
      'BGP Log': 'Yes',
      'RTBH': 'Yes',
      BFD: 'Yes',
      'DDoS Type': 'Yes',
      'Customer Port Type': 'Copper',
      'SNMP version': 'v2',
      'Fast Detect': 'Yes',
      Multiplier: '5',
      'Minimum Interval': '500',
    },
    texts: {
      'Disconnection SR Number': 'SR-L30-2198',
      'Disconnection LSI Number': 'LSI-L30-78120',
      'Customer PM First Name': 'Ravi',
      'Customer PM Last Name': 'Kumar',
      'Customer PM Phone': '9890011223',
      'Customer PM Email': 'ravi.kumar@hdfcbank.com',
      'Customer AS Number': '64521',
      'As Set': 'AS-HDFC-L30',
      'BGP Password': 'bgpL30#2026',
      'eBGP Multihop': '8',
      Keepalive: '90',
      Holdtime: '180',
      SOO: '65000:130',
      'Airtel Loopback IP': '10.30.1.1',
      'Customer Loopback IP': '10.30.1.2',
      'Customer LAN IP': '172.30.10.1',
      Username: 'snmp_low_user',
      Groupname: 'support-low',
      'Privacy / Encryption Type': 'AES-128',
      'Privacy / Encryption Password': 'LowEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-03',
      'BTS Address': 'Karol Bagh, New Delhi',
      'BTS NW Loc Code': 'DEL-BTS-03',
      CVLAN: '210',
      'Customer NW Loc Code': 'HDFC-DEL-L30',
      'ISP MPLS POP NW Loc Code': 'MPLS-DEL-03',
      LNSPopCode: 'LNS-DEL-03',
      'Network Element': 'NE-DEL-EDGE-03',
      'RSU NW Loc Code': 'RSU-DEL-03',
    },
  },
  '30-50%': {
    code: 'M50',
    dates: {
      'Customer Needed By Date': '2026-05-25',
      'Likely Date of Site Readiness': '2026-06-08',
    },
    selects: {
      'Reason for Zero Value Order': 'Waiver',
      Interface: 'Gigabit',
      'Site Readiness Status': 'Pending',
      'Routing Type': 'Static with Public BGP',
      'Handover Type': 'Non NNI',
      'Peering Type': 'Loopback',
      'BGP Input Type': 'Manual',
      'Remove Private AS': 'No',
      'AS Override': 'Yes',
      'BGP Dampening': 'No',
      'BGP Timers': 'Custom',
      'bgp-Replace AS': 'No',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'No',
      'BGP Log': 'Yes',
      RTBH: 'No',
      BFD: 'Yes',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
      'SNMP version': 'v3',
      'Fast Detect': 'Yes',
      Multiplier: '3',
      'Minimum Interval': '200',
    },
    texts: {
      'Disconnection SR Number': 'SR-M50-3301',
      'Disconnection LSI Number': 'LSI-M50-90112',
      'Customer PM First Name': 'Neha',
      'Customer PM Last Name': 'Sharma',
      'Customer PM Phone': '9891198822',
      'Customer PM Email': 'neha.sharma@hdfcbank.com',
      'Customer AS Number': '64531',
      'As Set': 'AS-HDFC-M50',
      'BGP Password': 'bgpM50#2026',
      'eBGP Multihop': '6',
      Keepalive: '60',
      Holdtime: '120',
      SOO: '65000:150',
      'Airtel Loopback IP': '10.50.1.1',
      'Customer Loopback IP': '10.50.1.2',
      'Customer LAN IP': '172.50.10.1',
      Username: 'snmp_m50_user',
      Groupname: 'support-mid',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'MidEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-05',
      'BTS Address': 'Dwarka Sector 12, Delhi',
      'BTS NW Loc Code': 'DEL-BTS-05',
      CVLAN: '250',
      'Customer NW Loc Code': 'HDFC-DEL-M50',
      'ISP MPLS POP NW Loc Code': 'MPLS-DEL-05',
      LNSPopCode: 'LNS-DEL-05',
      'Network Element': 'NE-DEL-EDGE-05',
      'RSU NW Loc Code': 'RSU-DEL-05',
    },
  },
  '50-70%': {
    code: 'M70',
    dates: {
      'Customer Needed By Date': '2026-05-10',
      'Likely Date of Site Readiness': '2026-05-28',
    },
    selects: {
      'Reason for Zero Value Order': 'N/A',
      Interface: '10G',
      'Site Readiness Status': 'Pending',
      'Routing Type': 'Public BGP',
      'Handover Type': 'Non NNI',
      'Peering Type': 'Loopback',
      'BGP Input Type': 'Auto',
      'Remove Private AS': 'No',
      'AS Override': 'Yes',
      'BGP Dampening': 'No',
      'BGP Timers': 'Default',
      'bgp-Replace AS': 'No',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'Yes',
      'BGP Log': 'No',
      RTBH: 'No',
      BFD: 'Yes',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
      'SNMP version': 'v3',
      'Fast Detect': 'No',
      Multiplier: '2',
      'Minimum Interval': '100',
    },
    texts: {
      'Disconnection SR Number': 'SR-M70-4822',
      'Disconnection LSI Number': 'LSI-M70-11132',
      'Customer PM First Name': 'Ankit',
      'Customer PM Last Name': 'Verma',
      'Customer PM Phone': '9810023456',
      'Customer PM Email': 'ankit.verma@hdfcbank.com',
      'Customer AS Number': '64541',
      'As Set': 'AS-HDFC-M70',
      'BGP Password': 'bgpM70#2026',
      'eBGP Multihop': '5',
      Keepalive: '45',
      Holdtime: '90',
      SOO: '65000:170',
      'Airtel Loopback IP': '10.70.1.1',
      'Customer Loopback IP': '10.70.1.2',
      'Customer LAN IP': '172.70.10.1',
      Username: 'snmp_m70_user',
      Groupname: 'support-high',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'HighEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-07',
      'BTS Address': 'Noida Sector 62',
      'BTS NW Loc Code': 'NCR-BTS-07',
      CVLAN: '310',
      'Customer NW Loc Code': 'HDFC-NCR-M70',
      'ISP MPLS POP NW Loc Code': 'MPLS-NCR-07',
      LNSPopCode: 'LNS-NCR-07',
      'Network Element': 'NE-NCR-EDGE-07',
      'RSU NW Loc Code': 'RSU-NCR-07',
    },
  },
  '70-85%': {
    code: 'H85',
    dates: {
      'Customer Needed By Date': '2026-04-30',
      'Likely Date of Site Readiness': '2026-05-15',
    },
    selects: {
      'Reason for Zero Value Order': 'N/A',
      Interface: '10G',
      'Site Readiness Status': 'Ready',
      'Routing Type': 'Static with Private BGP',
      'Handover Type': 'Non NNI',
      RTBH: 'No',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'No',
      'BGP Log': 'No',
      BFD: 'No',
      'Fast Detect': 'No',
      Multiplier: '2',
      'Minimum Interval': '100',
    },
    texts: {
      'Disconnection SR Number': 'SR-H85-5501',
      'Disconnection LSI Number': 'LSI-H85-22210',
      'Customer PM First Name': 'Meera',
      'Customer PM Last Name': 'Kapoor',
      'Customer PM Phone': '9820012345',
      'Customer PM Email': 'meera.kapoor@hdfcbank.com',
      'BGP Prefix Limit': '1200',
      Username: 'snmp_h85_user',
      Groupname: 'noc-high',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'ReadyEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-09',
      'BTS Address': 'Gurugram Cyber City',
      'BTS NW Loc Code': 'NCR-BTS-09',
      CVLAN: '330',
      'Customer NW Loc Code': 'HDFC-NCR-H85',
      'ISP MPLS POP NW Loc Code': 'MPLS-NCR-09',
      LNSPopCode: 'LNS-NCR-09',
      'Network Element': 'NE-NCR-EDGE-09',
      'RSU NW Loc Code': 'RSU-NCR-09',
    },
  },
  'Above 85%': {
    code: 'TOP',
    dates: {
      'Customer Needed By Date': '2026-04-25',
      'Likely Date of Site Readiness': '2026-05-05',
    },
    selects: {
      'Reason for Zero Value Order': 'N/A',
      Interface: '10G',
      'Site Readiness Status': 'Ready',
      'Routing Type': 'Static',
      'Handover Type': 'Non NNI',
      RTBH: 'No',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'No',
      'BGP Log': 'No',
      BFD: 'No',
      'Fast Detect': 'No',
      Multiplier: '1',
      'Minimum Interval': '100',
    },
    texts: {
      'Disconnection SR Number': 'SR-TOP-7001',
      'Disconnection LSI Number': 'LSI-TOP-30010',
      'Customer PM First Name': 'Priya',
      'Customer PM Last Name': 'Iyer',
      'Customer PM Phone': '9811112233',
      'Customer PM Email': 'priya.iyer@hdfcbank.com',
      'BGP Prefix Limit': '1500',
      Username: 'snmp_top_user',
      Groupname: 'noc-premium',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'TopEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-11',
      'BTS Address': 'Aerocity, New Delhi',
      'BTS NW Loc Code': 'DEL-BTS-11',
      CVLAN: '350',
      'Customer NW Loc Code': 'HDFC-DEL-TOP',
      'ISP MPLS POP NW Loc Code': 'MPLS-DEL-11',
      LNSPopCode: 'LNS-DEL-11',
      'Network Element': 'NE-DEL-EDGE-11',
      'RSU NW Loc Code': 'RSU-DEL-11',
    },
  },
}

const ROUTING_TYPE_DEPENDENT_VALUES = {
  Static: {
    selects: {
      'Customer Link Type': 'Customer Link',
      RTBH: 'No',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
    },
    texts: {
      'BGP Prefix Limit': '1000',
      Username: 'snmp_static_user',
      Groupname: 'static-ops',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'Static@2026',
      'Access POP NW Loc Code': 'DEL-POP-ST01',
      'BTS Address': 'Connaught Place, New Delhi',
      'BTS NW Loc Code': 'DEL-BTS-ST01',
      CVLAN: '120',
      'Customer NW Loc Code': 'HDFC-DEL-ST01',
      'ISP MPLS POP NW Loc Code': 'MPLS-DEL-ST01',
      LNSPopCode: 'LNS-DEL-ST01',
      'Network Element': 'NE-DEL-ST01',
      'RSU NW Loc Code': 'RSU-DEL-ST01',
    },
    dates: {
      'Likely Date of Site Readiness': '2026-05-15',
    },
  },
  'Private BGP': {
    selects: {
      'Remove Private AS': 'Yes',
      'Peering Type': 'Physical',
      'BGP Input Type': 'Manual',
      'Routing Table': 'Custom',
      'AS Override': 'No',
      'BGP Dampening': 'Yes',
      'BGP Timers': 'Custom',
      'bgp-Replace AS': 'Yes',
      'Customer Link Type': 'Customer Link',
      'Default Originate': 'Yes',
      'BGP Session Per Link': '2',
      'Send Community eBGP': 'Yes',
      'BGP Log': 'Yes',
      RTBH: 'Yes',
      BFD: 'Yes',
      'Fast Detect': 'Yes',
      Multiplier: '5',
      'Minimum Interval': '500',
      'SNMP version': 'v2',
      'DDoS Type': 'Yes',
      'Customer Port Type': 'Copper',
    },
    texts: {
      'Customer AS Number': '64521',
      'As Set': 'AS-HDFC-PRIV',
      'BGP Password': 'privBGP@2026',
      'eBGP Multihop': '8',
      Keepalive: '90',
      Holdtime: '180',
      SOO: '65000:121',
      'Airtel Loopback IP': '10.21.1.1',
      'Customer Loopback IP': '10.21.1.2',
      'Customer LAN IP': '172.21.10.1',
      Username: 'snmp_priv_user',
      Groupname: 'bgp-private',
      'Privacy / Encryption Type': 'AES-128',
      'Privacy / Encryption Password': 'PrivEnc@2026',
      'Access POP NW Loc Code': 'DEL-POP-PB01',
      'BTS Address': 'Noida Sector 62',
      'BTS NW Loc Code': 'NCR-BTS-PB01',
      CVLAN: '221',
      'Customer NW Loc Code': 'HDFC-NCR-PB01',
      'ISP MPLS POP NW Loc Code': 'MPLS-NCR-PB01',
      LNSPopCode: 'LNS-NCR-PB01',
      'Network Element': 'NE-NCR-PB01',
      'RSU NW Loc Code': 'RSU-NCR-PB01',
    },
    dates: {
      'Likely Date of Site Readiness': '2026-06-10',
    },
  },
  'Static with Public BGP': {
    selects: {
      'Remove Private AS': 'No',
      'Peering Type': 'Loopback',
      'BGP Input Type': 'Manual',
      'Routing Table': 'Default BGP',
      'AS Override': 'Yes',
      'BGP Dampening': 'No',
      'BGP Timers': 'Custom',
      'bgp-Replace AS': 'No',
      'Customer Link Type': 'Customer Link',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'No',
      'BGP Log': 'Yes',
      RTBH: 'No',
      BFD: 'Yes',
      'Fast Detect': 'Yes',
      Multiplier: '3',
      'Minimum Interval': '200',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
    },
    texts: {
      'Customer AS Number': '64531',
      'As Set': 'AS-HDFC-SPB',
      'BGP Password': 'stPubBGP@2026',
      'eBGP Multihop': '6',
      Keepalive: '60',
      Holdtime: '120',
      SOO: '65000:152',
      'Airtel Loopback IP': '10.31.1.1',
      'Customer Loopback IP': '10.31.1.2',
      'Customer LAN IP': '172.31.10.1',
      Username: 'snmp_spb_user',
      Groupname: 'bgp-hybrid',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'SpbEnc@2026',
    },
    dates: {
      'Likely Date of Site Readiness': '2026-05-28',
    },
  },
  'Public BGP': {
    selects: {
      'Remove Private AS': 'No',
      'Peering Type': 'Loopback',
      'BGP Input Type': 'Auto',
      'Routing Table': 'Default BGP',
      'AS Override': 'Yes',
      'BGP Dampening': 'No',
      'BGP Timers': 'Default',
      'bgp-Replace AS': 'No',
      'Customer Link Type': 'Customer Link',
      'Default Originate': 'No',
      'BGP Session Per Link': '1',
      'Send Community eBGP': 'Yes',
      'BGP Log': 'No',
      RTBH: 'No',
      BFD: 'Yes',
      'Fast Detect': 'No',
      Multiplier: '2',
      'Minimum Interval': '100',
      'SNMP version': 'v3',
      'DDoS Type': 'No',
      'Customer Port Type': 'Fiber',
    },
    texts: {
      'Customer AS Number': '64541',
      'As Set': 'AS-HDFC-PUB',
      'BGP Password': 'pubBGP@2026',
      'eBGP Multihop': '5',
      Keepalive: '45',
      Holdtime: '90',
      SOO: '65000:172',
      'Airtel Loopback IP': '10.41.1.1',
      'Customer Loopback IP': '10.41.1.2',
      'Customer LAN IP': '172.41.10.1',
      Username: 'snmp_pub_user',
      Groupname: 'bgp-public',
      'Privacy / Encryption Type': 'AES-256',
      'Privacy / Encryption Password': 'PubEnc@2026',
    },
    dates: {
      'Likely Date of Site Readiness': '2026-05-22',
    },
  },
  'Static with Private BGP': {
    selects: {
      'Remove Private AS': 'Yes',
      'Peering Type': 'Physical',
      'BGP Input Type': 'Manual',
      'Routing Table': 'Custom',
      'AS Override': 'No',
      'BGP Dampening': 'Yes',
      'BGP Timers': 'Custom',
      'bgp-Replace AS': 'Yes',
      'Customer Link Type': 'Customer Link',
      'Default Originate': 'Yes',
      'BGP Session Per Link': '2',
      'Send Community eBGP': 'Yes',
      'BGP Log': 'Yes',
      RTBH: 'Yes',
      BFD: 'Yes',
      'Fast Detect': 'Yes',
      Multiplier: '5',
      'Minimum Interval': '500',
      'SNMP version': 'v2',
      'DDoS Type': 'Yes',
      'Customer Port Type': 'Copper',
    },
    texts: {
      'Customer AS Number': '64551',
      'As Set': 'AS-HDFC-SPRIV',
      'BGP Password': 'stPrivBGP@2026',
      'eBGP Multihop': '8',
      Keepalive: '90',
      Holdtime: '180',
      SOO: '65000:182',
      'Airtel Loopback IP': '10.51.1.1',
      'Customer Loopback IP': '10.51.1.2',
      'Customer LAN IP': '172.51.10.1',
      Username: 'snmp_spriv_user',
      Groupname: 'bgp-static-private',
      'Privacy / Encryption Type': 'AES-128',
      'Privacy / Encryption Password': 'SPrivEnc@2026',
    },
    dates: {
      'Likely Date of Site Readiness': '2026-06-15',
    },
  },
}

function normalizeFieldLabel(raw) {
  return String(raw || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

function findFormFieldLabel(field, formEl) {
  let current = field.parentElement
  while (current && current !== formEl) {
    const scopedLabel = current.querySelector(':scope > label')
    if (scopedLabel) return normalizeFieldLabel(scopedLabel.textContent)
    current = current.parentElement
  }
  return ''
}

function getFallbackValue(label, profileCode, index) {
  if (!label) return ''
  if (label.toLowerCase().includes('email')) return `ops.${profileCode.toLowerCase()}${index}@hdfcbank.com`
  if (label.toLowerCase().includes('phone') || label.toLowerCase().includes('contact')) return `98${String(10000000 + index).slice(-8)}`
  if (label.toLowerCase().includes('password')) return `Pass@${profileCode}${index}`
  if (label.toLowerCase().includes('ip')) return `10.${index % 200}.${(index * 3) % 200}.1`
  if (label.toLowerCase().includes('number') || label.toLowerCase().includes('code')) return `${profileCode}-${String(index).padStart(4, '0')}`
  return `${label} ${profileCode} ${index}`
}

function FormField({ label, required, error, children, showOldValues, oldValue }) {
  return (
    <div>
      <label className={`block text-gray-600 mb-1 text-xs ${required ? '' : ''}`}>
        {required && <span className="text-red-500">*</span>}{label}
      </label>
      {children}
      {error && <p className="text-red-500 text-[10px] mt-0.5">{error}</p>}
      {showOldValues && <p className="text-[10px] text-gray-500 mt-0.5">Old Values: ({oldValue ?? '—'})</p>}
    </div>
  )
}

function FieldInput({ defaultValue = '', placeholder = '', disabled, className = '' }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-2 py-1.5 border border-gray-300 rounded text-xs ${disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-white'} ${className}`}
    />
  )
}

function FieldSelect({ options, defaultValue, value, onChange, disabled, placeholder }) {
  const isControlled = value !== undefined
  return (
    <select
      value={isControlled ? value : undefined}
      defaultValue={!isControlled ? defaultValue : undefined}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-2 py-1.5 border border-gray-300 rounded text-xs ${disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function FieldDate({ defaultValue = '', disabled }) {
  return (
    <div className="relative">
      <input
        type="date"
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full px-2 py-1.5 pr-8 border border-gray-300 rounded text-xs date-input-custom ${disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
      />
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

export default function ConfigureTechnicalAttributesContent({ onDirtyChange, compareWithAsset, technicalAttributesOverrides, confidenceLevel = 'Below 30%' }) {
  const formRef = useRef(null)
  const [routingType, setRoutingType] = useState(technicalAttributesOverrides?.routingType ?? '')
  const [activeConfidenceLevel, setActiveConfidenceLevel] = useState(confidenceLevel)
  useEffect(() => {
    if (technicalAttributesOverrides?.routingType) setRoutingType(technicalAttributesOverrides.routingType)
  }, [technicalAttributesOverrides])
  useEffect(() => {
    setActiveConfidenceLevel(confidenceLevel)
  }, [confidenceLevel])
  useEffect(() => {
    const profile = CONFIDENCE_LEVEL_PROFILES[activeConfidenceLevel] || CONFIDENCE_LEVEL_PROFILES['All Confidence Levels']
    const routingByConfidence = profile?.selects?.['Routing Type'] || 'Static'
    if (!technicalAttributesOverrides?.routingType) {
      setRoutingType(routingByConfidence)
    }
  }, [activeConfidenceLevel, technicalAttributesOverrides])

  useEffect(() => {
    const formEl = formRef.current
    if (!formEl) return

    const profile = CONFIDENCE_LEVEL_PROFILES[activeConfidenceLevel] || CONFIDENCE_LEVEL_PROFILES['All Confidence Levels']
    const desiredRoutingType = profile?.selects?.['Routing Type']
    if (!technicalAttributesOverrides?.routingType && desiredRoutingType) {
      setRoutingType(desiredRoutingType)
    }

    const timer = setTimeout(() => {
      let fallbackIndex = 1
      formEl.querySelectorAll('input, select, textarea').forEach((field) => {
        if (field.disabled) return
        const parentSection = field.closest('section')
        const sectionTitle = normalizeFieldLabel(parentSection?.querySelector('h3')?.textContent || '')
        if (sectionTitle === 'Account & Order Details') return
        const label = findFormFieldLabel(field, formEl)
        if (!label) return

        if (field.tagName === 'SELECT') {
          const desired = profile?.selects?.[label]
          if (desired && Array.from(field.options).some((opt) => opt.value === desired)) {
            field.value = desired
          } else if (field.value === '') {
            const firstSelectable = Array.from(field.options).find((opt) => opt.value !== '')
            if (firstSelectable) field.value = firstSelectable.value
          }
          return
        }

        if (field.type === 'date') {
          const desired = profile?.dates?.[label] || profile?.dates?.['Customer Needed By Date']
          if (desired) field.value = desired
          return
        }

        if (field.type === 'text') {
          const desired = profile?.texts?.[label]
          field.value = desired || getFallbackValue(label, profile?.code || 'ALL', fallbackIndex)
          fallbackIndex += 1
        }
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [activeConfidenceLevel])

  useEffect(() => {
    const formEl = formRef.current
    if (!formEl) return
    const routingProfile = ROUTING_TYPE_DEPENDENT_VALUES[routingType]
    if (!routingProfile) return

    const timer = setTimeout(() => {
      formEl.querySelectorAll('input, select, textarea').forEach((field) => {
        if (field.disabled) return
        const parentSection = field.closest('section')
        const sectionTitle = normalizeFieldLabel(parentSection?.querySelector('h3')?.textContent || '')
        if (sectionTitle === 'Account & Order Details') return
        const label = findFormFieldLabel(field, formEl)
        if (!label) return

        if (field.tagName === 'SELECT') {
          const desired = routingProfile.selects?.[label]
          if (desired && Array.from(field.options).some((opt) => opt.value === desired)) {
            field.value = desired
          }
          return
        }

        if (field.type === 'date') {
          const desired = routingProfile.dates?.[label]
          if (desired) field.value = desired
          return
        }

        if (field.type === 'text') {
          const desired = routingProfile.texts?.[label]
          if (desired) field.value = desired
        }
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [routingType])
  const gridClass = 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 text-xs'
  const isStaticRouting = routingType === 'Static'

  return (
    <form ref={formRef} onChange={() => onDirtyChange?.(true)} onInput={() => onDirtyChange?.(true)} className="space-y-8">
      {/* 1. Account & Order Details */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Account & Order Details</h3>
        <div className={gridClass}>
          <FormField label="Customer Name">
            <FieldInput defaultValue="HDFC Bank" disabled />
          </FormField>
          <FormField label="City">
            <FieldInput defaultValue="New Delhi" disabled />
          </FormField>
          <FormField label="State">
            <FieldInput defaultValue="Delhi" disabled />
          </FormField>
          <FormField label="LSI">
            <FieldInput defaultValue="8026000047801..." disabled />
          </FormField>
          <FormField label="Order Type">
            <FieldSelect options={OPTIONS.orderType} defaultValue="New" disabled />
          </FormField>
          <FormField label="PO Number">
            <FieldInput defaultValue="PO-00542904" disabled />
          </FormField>
          <FormField label="Feasibility Id">
            <FieldInput defaultValue="FZ-001234" disabled />
          </FormField>
          <FormField label="Cross Connect Feasibility Id">
            <FieldInput defaultValue="CCF-001" disabled />
          </FormField>
          <FormField label="KAM Name">
            <FieldInput defaultValue="Shivali Bakshi" disabled />
          </FormField>
          <FormField label="KAM Contact">
            <FieldInput defaultValue="8527999418" disabled />
          </FormField>
          <FormField label="Product">
            <FieldSelect options={OPTIONS.product} defaultValue="Primary Link" disabled />
          </FormField>
          <FormField label="RFS">
            <FieldDate defaultValue="2026-03-17" disabled />
          </FormField>
          <FormField label="Customer Needed By Date" required showOldValues={compareWithAsset} oldValue="15/04/2026">
            <FieldDate />
          </FormField>
          <FormField label="Disconnection SR Number" showOldValues={compareWithAsset} oldValue="SR-001234">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Disconnection LSI Number" showOldValues={compareWithAsset} oldValue="LSI-789012">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="PO Date">
            <FieldDate defaultValue="2026-01-15" disabled />
          </FormField>
          <FormField label="Business Circle">
            <FieldInput defaultValue="NCR" disabled />
          </FormField>
          <FormField label="Longitude">
            <FieldInput defaultValue="77.2090" disabled />
          </FormField>
          <FormField label="Latitude">
            <FieldInput defaultValue="28.6139" disabled />
          </FormField>
          <FormField label="Vertical Segment">
            <FieldInput defaultValue="Digital Media" disabled />
          </FormField>
          <FormField label="Customer Segment">
            <FieldInput defaultValue="AB" disabled />
          </FormField>
          <FormField label="Service Segment">
            <FieldInput defaultValue="Bharti" disabled />
          </FormField>
          <FormField label="Customer PM First Name" showOldValues={compareWithAsset} oldValue="John">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer PM Last Name" showOldValues={compareWithAsset} oldValue="Doe">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer PM Phone" showOldValues={compareWithAsset} oldValue="9876543210">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer PM Email" showOldValues={compareWithAsset} oldValue="john.doe@example.com">
            <FieldInput placeholder="" />
          </FormField>
        </div>
      </section>

      {/* 2. Internet */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Internet</h3>
        <div className={gridClass}>
          <FormField label="ISP Tagging" required>
            <FieldSelect options={OPTIONS.ispTaggings} defaultValue="N" disabled />
          </FormField>
          <FormField label="Ratio">
            <FieldInput defaultValue="1:1" disabled />
          </FormField>
          <FormField label="Sub Product Name">
            <FieldSelect options={OPTIONS.subProductName} defaultValue="Enterprise ILL" disabled />
          </FormField>
        </div>
      </section>

      {/* 3. Primary Link */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Primary Link</h3>
        <div className={gridClass}>
          <FormField label="Access Bandwidth">
            <FieldSelect options={OPTIONS.accessBandwidth} defaultValue="10 Mbps" disabled />
          </FormField>
          <FormField label="Authentication Type">
            <FieldSelect options={OPTIONS.authenticationType} defaultValue="" placeholder={SELECT_OPTION} disabled />
          </FormField>
          <FormField label="Relog Reason">
            <FieldSelect options={OPTIONS.relogReason} defaultValue="" placeholder={SELECT_OPTION} disabled />
          </FormField>
          <FormField label="Port Bandwidth">
            <FieldSelect options={OPTIONS.portBandwidth} defaultValue="10 Mbps" disabled />
          </FormField>
          <FormField label="Reason for Zero Value Order" showOldValues={compareWithAsset} oldValue="N/A">
            <FieldSelect options={OPTIONS.reasonForZeroValue} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Legacy Access Bandwidth">
            <FieldInput placeholder="" disabled />
          </FormField>
          <FormField label="Interface" required showOldValues={compareWithAsset} oldValue="Gigabit">
            <FieldSelect options={OPTIONS.interface} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Contract Term">
            <FieldInput defaultValue="12" disabled />
          </FormField>
          <FormField label="Media">
            <FieldSelect options={OPTIONS.media} defaultValue="FTTH" disabled />
          </FormField>
          <FormField label="POP">
            <FieldSelect options={OPTIONS.pop} defaultValue="Single POP" disabled />
          </FormField>
          <FormField label="Site Readiness Status" showOldValues={compareWithAsset} oldValue="Ready">
            <FieldSelect options={OPTIONS.siteReadinessStatus} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Last Mile">
            <FieldSelect options={OPTIONS.lastMile} defaultValue="Single Last Mile" disabled />
          </FormField>
          <FormField label="Redundancy">
            <FieldSelect options={OPTIONS.redundancy} defaultValue="No" disabled />
          </FormField>
          <FormField label="Service Type">
            <FieldSelect options={OPTIONS.serviceType} defaultValue="Unmanaged" disabled />
          </FormField>
          <FormField label="CPE">
            <FieldSelect options={OPTIONS.cpe} defaultValue="Select" disabled />
          </FormField>
          <FormField label="Uptime SLA">
            <FieldSelect options={OPTIONS.uptimeSLA} defaultValue="99%" disabled />
          </FormField>
          <FormField label="IP Required" required>
            <FieldSelect options={OPTIONS.ipRequired} defaultValue="IPv4" disabled />
          </FormField>
          <FormField label="DDOS Required">
            <FieldSelect options={OPTIONS.ddosRequired} defaultValue="No" disabled />
          </FormField>
          <FormField label="Cross Connect Required">
            <FieldSelect options={OPTIONS.crossConnectRequired} defaultValue="No" disabled />
          </FormField>
          <FormField label="Legacy Port Bandwidth">
            <FieldInput placeholder="" disabled />
          </FormField>
          <FormField label="Enterprise Connectivity Type">
            <FieldSelect options={['Primary', 'Secondary']} defaultValue="Primary" disabled />
          </FormField>
          <FormField label="MTU Size">
            <FieldSelect options={['1472', '1500', '9000']} defaultValue="1472" disabled />
          </FormField>
          <FormField label="Handover Type" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.handoverType} defaultValue="Non NNI" />
          </FormField>
          <FormField label="NNI Details">
            <FieldInput defaultValue="NNI-001" disabled />
          </FormField>
          <FormField label="Routing Protocol" required>
            <FieldSelect options={OPTIONS.routingProtocol} defaultValue="" placeholder={SELECT_OPTION} disabled />
          </FormField>
          <FormField label="Routing Type" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.routingType} value={routingType} onChange={(e) => setRoutingType(e.target.value)} placeholder={SELECT_OPTION} />
          </FormField>
          {isStaticRouting ? (
            <>
              <FormField label="Customer Link Type" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={['Customer Link', 'Other']} defaultValue="Customer Link" />
              </FormField>
              <FormField label="RTBH" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={OPTIONS.rtbh} defaultValue="" placeholder={SELECT_OPTION} />
              </FormField>
              <FormField label="BGP Prefix Limit" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput defaultValue="1000" />
              </FormField>
              <FormField label="Offnet Capex">
                <FieldInput placeholder="" disabled />
              </FormField>
              <FormField label="Likely Date of Site Readiness" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldDate />
              </FormField>
              <FormField label="Sub Product Name">
                <FieldSelect options={OPTIONS.subProductName} defaultValue="Enterprise ILL" disabled />
              </FormField>
              <FormField label="SNMP version" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={OPTIONS.snmpVersion} defaultValue="" placeholder={SELECT_OPTION} />
              </FormField>
              <FormField label="Username" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="Groupname" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="Privacy / Encryption Type" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="Privacy / Encryption Password" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="DDoS Type" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={OPTIONS.ddosType} defaultValue="No" />
              </FormField>
              <FormField label="Customer Port Type" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={OPTIONS.customerPortType} defaultValue="" placeholder={SELECT_OPTION} />
              </FormField>
              <FormField label="Access POP NW Loc Code" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="BTS Address" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="BTS NW Loc Code" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="CVLAN" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="Customer NW Loc Code" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="ISP MPLS POP NW Loc Code">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="LNSPopCode" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="Network Element" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
              <FormField label="RSU NW Loc Code" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldInput placeholder="" />
              </FormField>
            </>
          ) : (
            <>
          <FormField label="Customer AS Number" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Remove Private AS" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.removePrivateAS} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Peering Type" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.peeringType} defaultValue="Loopback" />
          </FormField>
          <FormField label="BGP Input Type" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.bgpInputType} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="As Set" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Routing Table" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.routingTable} defaultValue="Default BGP" />
          </FormField>
          <FormField label="BGP Password" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="eBGP Multihop" required>
            <FieldInput defaultValue="5" />
          </FormField>
          <FormField label="AS Override" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.asOverride} defaultValue="Yes" />
          </FormField>
          <FormField label="BGP Dampening" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.bgpDampening} defaultValue="No" />
          </FormField>
          <FormField label="BGP Timers" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.bgpTimers} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Keepalive" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Holdtime">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="bgp-Replace AS" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={['No', 'Yes']} defaultValue="No" />
          </FormField>
<FormField label="Customer Link Type" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={['Customer Link', 'Other']} defaultValue="Customer Link" />
          </FormField>
          <FormField label="SOO" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Default Originate" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.defaultOriginate} defaultValue="No" />
          </FormField>
          <FormField label="BGP Session Per Link" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.bgpSessionPerLink} defaultValue="1" />
          </FormField>
          <FormField label="Send Community eBGP">
            <FieldSelect options={OPTIONS.sendCommunityEbgp} defaultValue="No" />
          </FormField>
          <FormField label="BGP Log">
            <FieldSelect options={OPTIONS.bgpLog} defaultValue="No" />
          </FormField>
          <FormField label="RTBH">
            <FieldSelect options={OPTIONS.rtbh} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="BFD">
            <FieldSelect options={OPTIONS.bfd} defaultValue="No" />
          </FormField>
          <FormField label="Offnet Capex">
            <FieldInput placeholder="" disabled />
          </FormField>
          <FormField label="Likely Date of Site Readiness" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldDate />
          </FormField>
          <FormField label="Airtel Loopback IP" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer Loopback IP">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer LAN IP">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Fast Detect">
            <FieldSelect options={OPTIONS.fastDetect} defaultValue="No" />
          </FormField>
          <FormField label="Multiplier">
            <FieldSelect options={OPTIONS.multiplier} defaultValue="3" />
          </FormField>
          <FormField label="Minimum Interval">
            <FieldSelect options={OPTIONS.minimumInterval} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Sub Product Name">
            <FieldSelect options={OPTIONS.subProductName} defaultValue="Enterprise ILL" disabled />
          </FormField>
<FormField label="SNMP version" showOldValues={compareWithAsset} oldValue="Previous value">
                <FieldSelect options={OPTIONS.snmpVersion} defaultValue="" placeholder={SELECT_OPTION} />
              </FormField>
              <FormField label="Username" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Groupname">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Privacy / Encryption Type">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Privacy / Encryption Password">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="DDoS Type">
            <FieldSelect options={OPTIONS.ddosType} defaultValue="No" />
          </FormField>
          <FormField label="Customer Port Type">
            <FieldSelect options={OPTIONS.customerPortType} defaultValue="" placeholder={SELECT_OPTION} />
          </FormField>
          <FormField label="Access POP NW Loc Code">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="BTS Address">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="BTS NW Loc Code">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="CVLAN">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Customer NW Loc Code">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="ISP MPLS POP NW Loc Code">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="LNSPopCode">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="Network Element">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="RSU NW Loc Code">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="SFP Type" required>
            <FieldSelect options={OPTIONS.sfpType} defaultValue="Single Mode" />
          </FormField>
            </>
          )}
        </div>
      </section>

      {/* 4. Connectivity IP Block */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Connectivity IP Block</h3>
        <div className={gridClass}>
          <FormField label="Loopback IPv4 with Subnet M..." showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="Loopback IPv4 with Subnet M..." />
          </FormField>
          <FormField label="Loopback IPv4" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="Loopback IPv4" />
          </FormField>
        </div>
      </section>

      {/* 5. Connectivity LAN IP */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Connectivity LAN IP</h3>
        <div className={gridClass}>
          <FormField label="Add LAN IPv4" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="Add LAN IPv4" />
          </FormField>
          <FormField label="Delete LAN IPv4" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="Delete LAN IPv4" />
          </FormField>
          <FormField label="IP Type">
            <FieldSelect options={OPTIONS.ipType} defaultValue="IPv4" disabled />
          </FormField>
          <FormField label="LAN IPv4 Subnet Mask" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.lanSubnetMask} defaultValue="/29" />
          </FormField>
          <FormField label="Is Additional IP Block?" showOldValues={compareWithAsset} oldValue="Previous value">
            <div className="pt-2">
              <input type="checkbox" className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red" />
            </div>
          </FormField>
          <FormField label="LAN IPv4" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
        </div>
      </section>

      {/* 6. Connectivity WAN IP */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Connectivity WAN IP</h3>
        <div className={gridClass}>
          <FormField label="IP Type">
            <FieldSelect options={OPTIONS.ipType} defaultValue="IPv4" disabled />
          </FormField>
          <FormField label="WAN IPv4 CE Subnet Mask" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput defaultValue="/30" />
          </FormField>
          <FormField label="WAN IPv4 PE Subnet Mask" required showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput defaultValue="/30" />
          </FormField>
          <FormField label="Is Additional IP Block?" showOldValues={compareWithAsset} oldValue="Previous value">
            <div className="pt-2">
              <input type="checkbox" className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red" />
            </div>
          </FormField>
          <FormField label="WAN IPv4 CE" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="WAN IPv4 PE" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="WAN IPv4 Subnet Mask" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.wanSubnetMask} defaultValue="" placeholder="Select an Option" />
          </FormField>
          <FormField label="WAN IPv4 Pool" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldInput placeholder="" />
          </FormField>
          <FormField label="WAN IPv4 Pool Subnet" showOldValues={compareWithAsset} oldValue="Previous value">
            <FieldSelect options={OPTIONS.wanSubnetMask} defaultValue="" placeholder="Select an Option" />
          </FormField>
        </div>
      </section>
    </form>
  )
}
