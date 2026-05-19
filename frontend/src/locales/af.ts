import { TranslationKeys } from './en';

const af: TranslationKeys = {
  // Common
  save: 'Stoor',
  cancel: 'Kanselleer',
  close: 'Sluit',
  loading: 'Laai...',
  search: 'Soek',
  add: 'Voeg by',
  edit: 'Wysig',
  delete: 'Verwyder',
  confirm: 'Bevestig',
  yes: 'Ja',
  no: 'Nee',
  back: 'Terug',
  next: 'Volgende',
  submit: 'Indien',
  update: 'Opdateer',
  remove: 'Verwyder',
  view: 'Bekyk',
  download: 'Aflaai',
  export: 'Uitvoer',
  import: 'Invoer',
  actions: 'Aksies',
  status: 'Status',
  name: 'Naam',
  email: 'E-pos',
  phone: 'Telefoon',
  role: 'Rol',
  date: 'Datum',
  time: 'Tyd',
  notes: 'Notas',
  description: 'Beskrywing',
  type: 'Tipe',
  grade: 'Graad',
  class: 'Klas',
  school: 'Skool',
  active: 'Aktief',
  inactive: 'Onaktief',
  all: 'Alles',
  none: 'Geen',
  required: 'Verplig',
  optional: 'Opsioneel',
  error: 'Fout',
  success: 'Sukses',
  warning: 'Waarskuwing',
  info: 'Inligting',

  // Navigation
  nav: {
    dashboard: 'Paneelbord',
    students: 'Leerders',
    teachers: 'Onderwysers',
    parents: 'Ouers',
    classes: 'Klasse',
    behaviour: 'Gedrag',
    merits: 'Meriete',
    detentions: 'Nasittes',
    interventions: 'Intervensies',
    reports: 'Verslae & Analitika',
    settings: 'Instellings',
    notifications: 'Kennisgewings',
    messages: 'Boodskappe',
    attendance: 'Bywoning',
    timetable: 'Rooster',
    logout: 'Teken uit',
    profile: 'Profiel',
    myClass: 'My Klas',
    mySchedule: 'My Skedule',
    myChildren: 'My Kinders',
  },

  // Settings page
  settings: {
    title: 'Instellings',
    subtitle: 'Bestuur u rekeninginstellings en voorkeure',
    profile: 'Profiel',
    password: 'Wagwoord',
    schoolInfo: 'Skoolinligting',
    preferences: 'Voorkeure',
    language: 'Taal',
    profileInfo: 'Profielinligting',
    fullName: 'Volle Naam',
    emailAddress: 'E-posadres',
    phoneNumber: 'Telefoonnommer',
    updateProfile: 'Profiel Opdateer',
    updating: 'Opdatering...',
    employeeId: 'Werknemer-ID',
    assignedSchool: 'Toegewysde Skool',
    gradeResponsibility: 'Graadverantwoordelikheid',
    schoolCode: 'Skoolkode',
    shareCode: 'Deel hierdie kode met ouers om hul rekeninge te koppel',
    copied: 'Gekopieer!',
    copy: 'Kopieer',
    schoolName: 'Skoolnaam',
    schoolEmail: 'Skool E-pos',
    schoolPhone: 'Skool Telefoon',
    schoolAddress: 'Skooladres',
  },

  // Language settings
  language: {
    title: 'Taalinstellings',
    subtitle: 'Kies die vertaaltaal vir u portaal',
    myLanguage: 'My Portaaltaal',
    myLanguageDesc: 'Verander slegs die taal vir u eie portaal. Dit oorskry die skoolstandaard.',
    globalLanguage: 'Verstektaal vir Alle Portale',
    globalLanguageDesc: 'Stel die verstektaal vir alle gebruikers wat nie hul eie gekies het nie. Bestaande persoonlike voorkeure word nie geraak nie.',
    currentLanguage: 'Tans aktiewe taal',
    saveMyLanguage: 'Stoor My Taal',
    saveGlobalLanguage: 'Stoor Verstektaal',
    saving: 'Stoor...',
    savedSuccess: 'Taalvoorkeur gestoor!',
    globalSavedSuccess: 'Globale taal opgedateer vir alle portale!',
    resetToGlobal: 'Herstel na skoolstandaard',
    usingGlobal: 'Gebruik skoolstandaard',
    usingPersonal: 'Gebruik u persoonlike voorkeur',
    adminNote: 'As administrateur kan u beide u persoonlike taal en die skoolwye standaard instel.',
    hierarchyNote: 'Taalprioriteit: U voorkeur → Skoolstandaard → Engels',
  },

  // Language names
  languages: {
    en: 'Engels',
    af: 'Afrikaans',
    zu: 'isiZulu',
    xh: 'isiXhosa',
  },

  // Auth
  auth: {
    login: 'Teken In',
    logout: 'Teken Uit',
    email: 'E-pos',
    password: 'Wagwoord',
    forgotPassword: 'Wagwoord vergeet?',
    noAccount: 'Het u nie \'n rekening nie?',
    haveAccount: 'Het u reeds \'n rekening?',
    signUp: 'Registreer',
    welcome: 'Welkom terug',
  },

  // Dashboard
  dashboard: {
    welcome: 'Welkom',
    overview: 'Oorsig',
    recentActivity: 'Onlangse Aktiwiteit',
    totalStudents: 'Totale Leerders',
    totalTeachers: 'Totale Onderwysers',
    activeClasses: 'Aktiewe Klasse',
  },

  // Students
  students: {
    title: 'Leerders',
    addStudent: 'Voeg Leerder By',
    studentProfile: 'Leerderprofiel',
    firstName: 'Voornaam',
    lastName: 'Van',
    studentId: 'Leerder-ID',
    dateOfBirth: 'Geboortedatum',
    noStudents: 'Geen leerders gevind nie',
  },

  // Behaviour
  behaviour: {
    title: 'Gedrag',
    logIncident: 'Voorval Aanmeld',
    incidentType: 'Voorvaltipe',
    severity: 'Erns',
    low: 'Laag',
    medium: 'Medium',
    high: 'Hoog',
    noIncidents: 'Geen voorvalle gevind nie',
  },

  // Detentions
  detentions: {
    title: 'Nasittes',
    addDetention: 'Voeg Nasit By',
    detentionDate: 'Nasitdatum',
    venue: 'Plek',
    attended: 'Bygewoon',
    absent: 'Afwesig',
    noDetentions: 'Geen nasittes gevind nie',
  },

  // Merits
  merits: {
    title: 'Meriete',
    awardMerit: 'Ken Meriet Toe',
    meritPoints: 'Merietpunte',
    noMerits: 'Geen meriete gevind nie',
  },

  // Notifications
  notifications: {
    title: 'Kennisgewings',
    markAllRead: 'Merk Alles as Gelees',
    noNotifications: 'Geen kennisgewings nie',
    emailNotifications: 'E-poskennisgewings',
    notifyOnBehaviour: 'Stel in kennis by Gedragsvoorvalle',
    notifyOnMerits: 'Stel in kennis by Meriete',
    notifyOnDetention: 'Stel in kennis by Nasittes',
    notifyOnAbsence: 'Stel in kennis by Afwesigheid',
  },

  // Password
  password: {
    changePassword: 'Verander Wagwoord',
    currentPassword: 'Huidige Wagwoord',
    newPassword: 'Nuwe Wagwoord',
    confirmPassword: 'Bevestig Wagwoord',
    passwordChanged: 'Wagwoord suksesvol verander!',
    passwordMismatch: 'Wagwoorde stem nie ooreen nie',
  },

  // Errors
  errors: {
    required: 'Hierdie veld is verplig',
    invalidEmail: 'Voer asseblief \'n geldige e-posadres in',
    networkError: 'Netwerkfout. Probeer asseblief weer.',
    unauthorized: 'U is nie gemagtig om hierdie aksie uit te voer nie',
    notFound: 'Die gevraagde hulpbron is nie gevind nie',
  },
};

export default af;
