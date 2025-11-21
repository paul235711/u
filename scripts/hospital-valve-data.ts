// Medical gas valve data based on hospital floor plans

export interface ValveInfo {
  id: string;
  location: string;
  zone: string;
  service: string;
  type: 'isolation' | 'secondary';
  gasType: 'oxygen' | 'nitrous_oxide' | 'medical_air' | 'vacuum';
}

const OXYGEN_VALVES: ValveInfo[] = [
  // Main oxygen system
  { id: 'V2', location: 'SOUS-SOL', zone: 'AU STOCKAGE CENTRALE', service: 'COUPURE GENERALE', type: 'isolation', gasType: 'oxygen' },
  { id: 'V4', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERALE BATIMENT DOMINICAINES', type: 'isolation', gasType: 'oxygen' },
  { id: 'V5', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT MEDECINE', type: 'isolation', gasType: 'oxygen' },
  { id: 'V6', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT CHIRURGIE', type: 'isolation', gasType: 'oxygen' },
  { id: 'V7', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE ATELIER', service: 'REANIMATION 1er SOUS-SOL', type: 'isolation', gasType: 'oxygen' },
  { id: 'V8', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE NAISSANCES 1er SOUS-SOL', type: 'isolation', gasType: 'oxygen' },
  { id: 'V9', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE REVEIL 1er SOUS-SOL', type: 'isolation', gasType: 'oxygen' },
  { id: 'V10', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'BLOC OPERATOIRE 1er SOUS-SOL + ETAGES', type: 'isolation', gasType: 'oxygen' },
  { id: 'V11', location: 'R.D CHAUS.', zone: 'REZ DE CHAUSSEE', service: 'REZ DE CHAUSSEE ET ETAGES BATIMENT CHIRURGIE', type: 'isolation', gasType: 'oxygen' },
  { id: 'V12', location: '2-SOUS-SOL', zone: 'SOUS-STATION FACESTERILISATION', service: 'BAT. CHIRURGIE CLINIQUE', type: 'isolation', gasType: 'oxygen' },
  { id: 'R1', location: 'R.D CHAUS.', zone: 'COULOIR FACE LABO', service: 'BAT. DOMINICAINES CONSULT. GYNECO.PEDIATRIE LABO', type: 'secondary', gasType: 'oxygen' },
  { id: 'R2', location: '1er ETAGE', zone: 'ENTREE SERVICE', service: 'BAT. DOMINICAINES MEDECINE "A" + REEDUCATION', type: 'secondary', gasType: 'oxygen' },
  { id: 'R3', location: '2ème ETAGE', zone: 'ENTREE SERVICE', service: 'BAT. DOMINICAINES MEDECINE "B" + CONSULTATIONS', type: 'secondary', gasType: 'oxygen' },
  // 3ème ETAGE – Bâtiment Dominicaines – zone CONSULATIONS EXTERNES
  { id: 'R4', location: '3ème ETAGE', zone: 'CONSULTATIONS EXTERNES', service: 'BAT. DOMINICAINES CONSULTATIONS EXTERNES', type: 'secondary', gasType: 'oxygen' },
  { id: 'R5', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. MEDECINE RADIOLOGIE SCANNER', type: 'secondary', gasType: 'oxygen' },
  { id: 'R6', location: 'R.D CHAUS.', zone: 'ENTREE SERVICE', service: 'BAT. MEDECINE URGENCES', type: 'secondary', gasType: 'oxygen' },
  { id: 'R7', location: '1er ETAGE', zone: 'COULOIR SERVICE', service: 'BAT. MEDECINE SERVICE TAMPON', type: 'secondary', gasType: 'oxygen' },
  { id: 'R8', location: '2ème ETAGE', zone: 'COULOIR SERVICE', service: 'BAT. MEDECINE MEDECINE "C"', type: 'secondary', gasType: 'oxygen' },
  // 3ème ETAGE – Bâtiment Médecine – zone S.S.R.
  { id: 'R9', location: '3ème ETAGE', zone: 'S.S.R.', service: 'BAT. MEDECINE S.S.R.', type: 'secondary', gasType: 'oxygen' },
  { id: 'R10', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. CHIRURGIE CLINIQUE REANIMATION USSC', type: 'secondary', gasType: 'oxygen' },
  { id: 'R11', location: '1-SOUS-SOL', zone: 'COULOIR EXT. FACE REVEIL', service: 'BAT. CHIRURGIE CLINIQUE SALLE NAISSANCES', type: 'secondary', gasType: 'oxygen' },
  { id: 'R12', location: '1-SOUS-SOL', zone: 'BUREAU INFIRMIERE', service: 'BAT. CHIRURGIE CLINIQUE SALLE REVEIL', type: 'secondary', gasType: 'oxygen' },
  { id: 'R13', location: '1-SOUS-SOL', zone: 'ARRIERE SALLE "4"', service: 'BAT. CHIRURGIE CLINIQUE BLOC OPERATOIRE', type: 'secondary', gasType: 'oxygen' },
];

const NITROUS_OXIDE_VALVES: ValveInfo[] = [
  { id: 'V101', location: 'EXTERIEUR', zone: 'AU STOCKAGE CENTRALE', service: 'COUPURE GENERALE', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'V102', location: '1-SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT MEDECINE', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'V103', location: '1-SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERALE BATIMENT DOMINICAINES', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'V104', location: '1-SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT CHIRURGIE', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'V105', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE NAISSANCES 1er SOUS-SOL', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'V106', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'BLOC OPERATOIRE 1er SOUS-SOL', type: 'isolation', gasType: 'nitrous_oxide' },
  { id: 'R101', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. MEDECINE RADIOLOGIE SCANNER', type: 'secondary', gasType: 'nitrous_oxide' },
  { id: 'R102', location: '1-SOUS-SOL', zone: 'COULOIR EXT. FACE REVEIL', service: 'BAT. CHIRURGIE CLINIQUE SALLE NAISSANCES', type: 'secondary', gasType: 'nitrous_oxide' },
  { id: 'R103', location: '1-SOUS-SOL', zone: 'ARRIERE SALLE "4"', service: 'BAT. CHIRURGIE CLINIQUE BLOC OPERATOIRE', type: 'secondary', gasType: 'nitrous_oxide' },
];

const MEDICAL_AIR_VALVES: ValveInfo[] = [
  { id: 'V201', location: 'EXTERIEUR', zone: 'AU STOCKAGE CENTRALE', service: 'COUPURE GENERALE', type: 'isolation', gasType: 'medical_air' },
  { id: 'V202', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'COUPURE GENERALE', type: 'isolation', gasType: 'medical_air' },
  { id: 'V204', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERALE BATIMENT DOMINICAINES', type: 'isolation', gasType: 'medical_air' },
  { id: 'V205', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT MEDECINE', type: 'isolation', gasType: 'medical_air' },
  { id: 'V206', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERAL BATIMENT CHIRURGIE', type: 'isolation', gasType: 'medical_air' },
  { id: 'V207', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE ATELIER', service: 'REANIMATION 1er SOUS-SOL', type: 'isolation', gasType: 'medical_air' },
  { id: 'V208', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE NAISSANCES 1er SOUS-SOL', type: 'isolation', gasType: 'medical_air' },
  { id: 'V209', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE REVEIL 1er SOUS-SOL + CHIRURGIE "2" 2ème ETAGE', type: 'isolation', gasType: 'medical_air' },
  { id: 'V210', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'BLOC OPERATOIRE 1er SOUS-SOL', type: 'isolation', gasType: 'medical_air' },
  { id: 'R201', location: 'R.D CHAUS.', zone: 'COULOIR FACE LABO', service: 'BAT. DOMINICAINES CONSULT. GYNECO.PEDIATRIE', type: 'secondary', gasType: 'medical_air' },
  { id: 'R202', location: 'R.D CHAUS.', zone: 'ENTREE SERVICE', service: 'BAT. DOMINICAINES APPAREILLAGE + LABORATOIRE', type: 'secondary', gasType: 'medical_air' },
  { id: 'R203', location: '1er ETAGE', zone: 'ENTREE SERVICE', service: 'BAT. DOMINICAINES MEDECINE "A" + CONSULTATIONS', type: 'secondary', gasType: 'medical_air' },
  { id: 'R206', location: 'R.D CHAUS.', zone: 'COULOIR SERVICE', service: 'BAT. MEDECINE URGENCES', type: 'secondary', gasType: 'medical_air' },
  { id: 'R211', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. CHIRURGIE CLINIQUE REANIMATION', type: 'secondary', gasType: 'medical_air' },
];

const VACUUM_VALVES: ValveInfo[] = [
  { id: 'V301', location: 'EXTERIEUR', zone: 'GROUPE DE VIDE', service: 'COUPURE GENERALE', type: 'isolation', gasType: 'vacuum' },
  { id: 'V302', location: 'EXTERIEUR', zone: 'GROUPE DE VIDE', service: 'GENERAL BAT. MEDECINE CHARITE DOMINICAINES', type: 'isolation', gasType: 'vacuum' },
  { id: 'V303', location: 'EXTERIEUR', zone: 'GROUPE DE VIDE', service: 'BLOC OPERATOIRE 1er SOUS-SOL + ETAGES', type: 'isolation', gasType: 'vacuum' },
  { id: 'V304', location: 'EXTERIEUR', zone: 'GROUPE DE VIDE', service: 'GENERAL BATIMENT CHIRURGIE', type: 'isolation', gasType: 'vacuum' },
  { id: 'V305', location: 'EXTERIEUR', zone: 'GROUPE DE VIDE', service: 'SECOURS', type: 'isolation', gasType: 'vacuum' },
  { id: 'V306', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'SECOURS BATIMENT MEDECINE', type: 'isolation', gasType: 'vacuum' },
  { id: 'V307', location: 'SOUS-SOL', zone: 'SOUS-SOL CENTRE HOSPITALIER', service: 'GENERALE BATIMENT DOMINICAINES', type: 'isolation', gasType: 'vacuum' },
  { id: 'V308', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE ATELIER', service: 'REANIMATION 1er SOUS-SOL', type: 'isolation', gasType: 'vacuum' },
  { id: 'V309', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE NAISSANCES 1er SOUS-SOL', type: 'isolation', gasType: 'vacuum' },
  { id: 'V310', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'SALLE REVEIL 1er SOUS-SOL + ETAGES', type: 'isolation', gasType: 'vacuum' },
  { id: 'V311', location: '2-SOUS-SOL', zone: '2ème SOUS-SOL CLINIQUE', service: 'BLOC OPERATOIRE 1er SOUS-SOL + ETAGES', type: 'isolation', gasType: 'vacuum' },
  { id: 'V312', location: 'R.D CHAUS.', zone: 'COULOIR FACE LABO', service: 'BAT. DOMINICAINES CONSULT. GYNECO.PEDIATRIE', type: 'secondary', gasType: 'vacuum' },
  { id: 'V313', location: '1er ETAGE', zone: 'ENTREE SERVICE', service: 'BAT. DOMINICAINES MEDECINE "A" + REEDUCATION', type: 'secondary', gasType: 'vacuum' },
  { id: 'V316', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. MEDECINE RADIOLOGIE SCANNER', type: 'secondary', gasType: 'vacuum' },
  { id: 'V317', location: 'R.D CHAUS.', zone: 'ENTREE SERVICE', service: 'BAT. MEDECINE URGENCES', type: 'secondary', gasType: 'vacuum' },
  { id: 'V321', location: '1-SOUS-SOL', zone: 'ENTREE SERVICE', service: 'BAT. CHIRURGIE CLINIQUE REANIMATION', type: 'secondary', gasType: 'vacuum' },
  { id: 'V322', location: '1-SOUS-SOL', zone: 'COULOIR EXT. FACE REVEIL', service: 'BAT. CHIRURGIE CLINIQUE SALLE NAISSANCES', type: 'secondary', gasType: 'vacuum' },
  { id: 'V323', location: '1-SOUS-SOL', zone: 'BUREAU INFIRMIERE', service: 'BAT. CHIRURGIE CLINIQUE SALLE REVEIL', type: 'secondary', gasType: 'vacuum' },
  { id: 'V324', location: '1-SOUS-SOL', zone: 'ARRIERE SALLE "4"', service: 'BAT. CHIRURGIE CLINIQUE BLOC OPERATOIRE', type: 'secondary', gasType: 'vacuum' },
];

export const valveData = {
  allValves: [...OXYGEN_VALVES, ...NITROUS_OXIDE_VALVES, ...MEDICAL_AIR_VALVES, ...VACUUM_VALVES],
  oxygenValves: OXYGEN_VALVES,
  nitrousOxideValves: NITROUS_OXIDE_VALVES,
  medicalAirValves: MEDICAL_AIR_VALVES,
  vacuumValves: VACUUM_VALVES,
};
