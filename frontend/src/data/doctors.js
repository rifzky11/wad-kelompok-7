/**
 * Data Tenaga Medis & Jadwal Kerja Khusus Layanan "Konsultasi" dan "Pemeriksaan"
 * Klinik Sehatin
 */

export const DOCTOR_SCHEDULES = {
  "Pemeriksaan Umum": {
    doctor: "dr. Andi Pratama, Sp.PD",
    specialty: "Spesialis Penyakit Dalam",
    schedule: "Senin – Jumat (08:00 – 14:00 WIB)",
    days: "Senin – Jumat",
    hours: "08:00 – 14:00 WIB",
    room: "Poli Umum • Lt. 1 (R. 102)",
    icon: "🩺",
  },
  "Konsultasi Gigi": {
    doctor: "drg. Siti Nurhaliza, Sp.KG",
    specialty: "Spesialis Konservasi Gigi",
    schedule: "Senin – Sabtu (09:00 – 16:00 WIB)",
    days: "Senin – Sabtu",
    hours: "09:00 – 16:00 WIB",
    room: "Poli Gigi • Lt. 2 (R. 204)",
    icon: "🦷",
  },
  "Pemeriksaan Kesehatan Anak": {
    doctor: "dr. Budi Setiawan, Sp.A",
    specialty: "Spesialis Anak & Tumbuh Kembang",
    schedule: "Senin – Kamis (08:30 – 13:00 WIB)",
    days: "Senin – Kamis",
    hours: "08:30 – 13:00 WIB",
    room: "Poli Anak • Lt. 1 (R. 105)",
    icon: "👶",
  },
  "Laboratorium Darah Lengkap": {
    doctor: "dr. Ratna Wulandari, Sp.PK",
    specialty: "Spesialis Patologi Klinik",
    schedule: "Setiap Hari (07:00 – 20:00 WIB)",
    days: "Setiap Hari (Senin – Minggu)",
    hours: "07:00 – 20:00 WIB",
    room: "Laboratorium Terpadu • Lt. 1",
    icon: "🔬",
  },
  "Vaksinasi & Imunisasi": {
    doctor: "dr. Maya Indriani, M.Biomed",
    specialty: "Konsultan Vaksinasi & Imunisasi",
    schedule: "Selasa, Kamis & Sabtu (09:00 – 12:00 WIB)",
    days: "Selasa, Kamis, Sabtu",
    hours: "09:00 – 12:00 WIB",
    room: "Klinik Vaksinasi • Lt. 1 (R. 108)",
    icon: "💉",
  },
  "Fisioterapi & Rehabilitasi Medis": {
    doctor: "dr. Hendra Wijaya, Sp.KFR",
    specialty: "Spesialis Kedokteran Fisik & Rehabilitasi",
    schedule: "Senin, Rabu & Jumat (10:00 – 16:00 WIB)",
    days: "Senin, Rabu, Jumat",
    hours: "10:00 – 16:00 WIB",
    room: "Ruang Fisioterapi • Lt. 2 (R. 210)",
    icon: "🏃‍♂️",
  },
  "Pemeriksaan USG & Kebidanan": {
    doctor: "dr. Dewi Kartika, Sp.OG",
    specialty: "Spesialis Obstetri & Ginekologi (Kebidanan)",
    schedule: "Senin – Jumat (09:00 – 15:00 WIB)",
    days: "Senin – Jumat",
    hours: "09:00 – 15:00 WIB",
    room: "Poli Kebidanan • Lt. 2 (R. 201)",
    icon: "🤰",
  },
  "Medical Check Up Dasar": {
    doctor: "dr. Farhan Alamsyah, Sp.PD",
    specialty: "Penanggung Jawab Medical Check Up",
    schedule: "Senin – Sabtu (08:00 – 12:00 WIB)",
    days: "Senin – Sabtu",
    hours: "08:00 – 12:00 WIB",
    room: "Unit MCU Terpadu • Lt. 1 (R. 101)",
    icon: "📋",
  },
};

/**
 * Mendapatkan informasi dokter dan jadwal kerja untuk suatu layanan medis.
 * Khusus untuk kategori "konsultasi" dan "pemeriksaan".
 */
export function getServiceDoctorSchedule(service) {
  if (!service) return null;
  const category = String(service.category || "").toLowerCase();
  const isConsultation = category === "konsultasi";
  const isExamination = category === "pemeriksaan";

  if (!isConsultation && !isExamination) {
    return null;
  }

  const preset = DOCTOR_SCHEDULES[service.title] || {
    doctor:
      service.doctor_name ||
      (isConsultation
        ? "dr. Rian Hidayat, Sp.PD"
        : "dr. Sarah Anindita, Sp.PK"),
    specialty: isConsultation
      ? "Dokter Spesialis Konsultasi Medis"
      : "Dokter Spesialis Pemeriksaan Klinis",
    schedule: service.schedule || "Senin – Jumat (08:00 – 15:00 WIB)",
    days: "Senin – Jumat",
    hours: "08:00 – 15:00 WIB",
    room: isConsultation
      ? "Ruang Konsultasi Medis • Lt. 1"
      : "Ruang Tindakan & Pemeriksaan • Lt. 1",
    icon: isConsultation ? "👨‍⚕️" : "🩺",
  };

  return {
    doctor: service.doctor_name || preset.doctor,
    specialty: preset.specialty,
    schedule: service.schedule || preset.schedule,
    days: preset.days,
    hours: preset.hours,
    room: preset.room,
    icon: preset.icon,
  };
}
