const PATIENTS = [
  { id: 'P-101', name: 'Ahmet Yılmaz', tcNo: '23485910292', phone: '+90 532 123 45 67', email: 'ahmet.yilmaz@email.com', bloodType: 'A Rh+', lastVisit: '2026-06-10', status: 'Active' },
  { id: 'P-102', name: 'Merve Demir', tcNo: '10984950384', phone: '+90 543 987 65 43', email: 'merve.demir@email.com', bloodType: '0 Rh-', lastVisit: '2026-06-08', status: 'Active' },
  { id: 'P-103', name: 'Caner Özkan', tcNo: '48201938592', phone: '+90 505 456 78 90', email: 'caner.ozkan@email.com', bloodType: 'B Rh+', lastVisit: '2026-06-05', status: 'Completed' },
  { id: 'P-104', name: 'Elif Kaya', tcNo: '59203948591', phone: '+90 555 111 22 33', email: 'elif.kaya@email.com', bloodType: 'AB Rh+', lastVisit: '2026-06-11', status: 'Active' },
  { id: 'P-105', name: 'Mustafa Şahin', tcNo: '30491827463', phone: '+90 533 444 55 66', email: 'mustafa.sahin@email.com', bloodType: '0 Rh+', lastVisit: '2026-05-28', status: 'Inactive' },
  { id: 'P-106', name: 'Zeynep Çelik', tcNo: '18492039485', phone: '+90 542 333 44 55', email: 'zeynep.celik@email.com', bloodType: 'A Rh-', lastVisit: '2026-06-09', status: 'Active' },
]

const CONSENTS = [
  { id: 'C-901', patientId: 'P-101', patientName: 'Ahmet Yılmaz', procedure: 'Diş İmplantı Cerrahisi', doctor: 'Dr. Selin Kaya', status: 'pending', date: '2026-06-11', signature: null, pdfPath: null },
  { id: 'C-902', patientId: 'P-102', patientName: 'Merve Demir', procedure: 'Koroner Anjiyografi', doctor: 'Dr. Emre Demir', status: 'signed', date: '2026-06-10', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>', pdfPath: null },
  { id: 'C-903', patientId: 'P-104', patientName: 'Elif Kaya', procedure: 'Histeroskopi', doctor: 'Dr. Müge Ateş Tıkız', status: 'pending', date: '2026-06-11', signature: null, pdfPath: null },
  { id: 'C-904', patientId: 'P-106', patientName: 'Zeynep Çelik', procedure: 'Kanal Tedavisi', doctor: 'Dr. Selin Kaya', status: 'signed', date: '2026-06-09', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 5 25 C 20 5 40 5 60 25 S 80 5 95 15" fill="none" stroke="black" stroke-width="2"/></svg>', pdfPath: null },
]

export const mockPatients = () => structuredClone(PATIENTS)
export const mockConsents = () => structuredClone(CONSENTS)
