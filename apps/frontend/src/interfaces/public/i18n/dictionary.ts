import type { AppLanguage } from './types'

type LangMap = Record<AppLanguage, string>

export const dictionary: Record<string, LangMap> = {
  // --- PublicLayout header nav ---
  'nav.alerts': { en: 'Alerts', zh: '警报', ms: 'Amaran', ta: 'எச்சரிக்கைகள்' },
  'nav.report': { en: 'Report', zh: '报告', ms: 'Lapor', ta: 'அறிவிக்க' },
  'nav.volunteer': { en: 'Volunteer', zh: '志愿服务', ms: 'Sukarelawan', ta: 'தொண்டர்' },
  'nav.community': { en: 'Community', zh: '社区', ms: 'Komuniti', ta: 'சமூகம்' },
  'nav.profile': { en: 'Profile', zh: '个人资料', ms: 'Profil', ta: 'சுயம்' },

  // --- AlertsPage ---
  'alerts.sectionLabel': { en: 'OFFICIAL BROADCASTS', zh: '官方广播', ms: 'SIARAN RASMI', ta: 'அதிகாரப்பூர்வ ஒளிபரப்புகள்' },
  'alerts.heading': { en: 'Alerts', zh: '警报', ms: 'Amaran', ta: 'எச்சரிக்கைகள்' },
  'alerts.subtitle': {
    en: 'Live government advisories and zone announcements for public safety.',
    zh: '实时政府公告和区域通知，保障公众安全。',
    ms: 'Nasihat kerajaan secara langsung dan pengumuman zon untuk keselamatan awam.',
    ta: 'பொது பாதுகாப்பிற்கான நேரடி அரசு அறிவுறுத்தல்கள் மற்றும் மண்டல அறிவிப்புகள்.',
  },
  'alerts.refresh': { en: 'Refresh', zh: '刷新', ms: 'Muat Semula', ta: 'புதுப்பிக்கவும்' },
  'alerts.viewAdvisory': { en: 'View advisory', zh: '查看公告', ms: 'Lihat nasihat', ta: 'அறிவுறுத்தலைக் காண்க' },
  'alerts.issuedBy': { en: 'Issued by {author}', zh: '发布者：{author}', ms: 'Dikeluarkan oleh {author}', ta: '{author} வெளியிட்டது' },
  'alerts.issuedByDate': { en: 'Issued by {author} - {date}', zh: '发布者：{author} - {date}', ms: 'Dikeluarkan oleh {author} - {date}', ta: '{author} வெளியிட்டது - {date}' },
  'alerts.loading': { en: 'Loading official broadcasts...', zh: '正在加载官方广播...', ms: 'Memuatkan siaran rasmi...', ta: 'அதிகாரப்பூர்வ ஒளிபரப்புகளை ஏற்றுகிறது...' },
  'alerts.empty': { en: 'No public or zone broadcasts are currently published.', zh: '目前没有已发布的公共或区域广播。', ms: 'Tiada siaran awam atau zon yang diterbitkan sekarang.', ta: 'தற்போது பொது அல்லது மண்டல ஒளிபரப்புகள் வெளியிடப்படவில்லை.' },
  'alerts.emptyFilter': { en: 'No public alerts match this filter.', zh: '没有与此筛选条件匹配的公共警报。', ms: 'Tiada amaran awam sepadan dengan tapisan ini.', ta: 'இந்த வடிகட்டியுடன் பொது எச்சரிக்கைகள் எதுவும் பொருந்தவில்லை.' },
  'alerts.error': { en: 'Unable to load official broadcasts right now.', zh: '目前无法加载官方广播。', ms: 'Tidak dapat memuatkan siaran rasmi sekarang.', ta: 'தற்போது அதிகாரப்பூர்வ ஒளிபரப்புகளை ஏற்ற முடியவில்லை.' },

  // --- AlertSummaryCards ---
  'summary.broadcasts': { en: 'Official broadcasts', zh: '官方广播', ms: 'Siaran rasmi', ta: 'அதிகாரப்பூர்வ ஒளிபரப்புகள்' },
  'summary.critical': { en: 'Critical alerts', zh: '紧急警报', ms: 'Amaran kritikal', ta: 'முக்கிய எச்சரிக்கைகள்' },
  'summary.zoneUpdates': { en: 'Zone updates', zh: '区域更新', ms: 'Kemas kini zon', ta: 'மண்டல புதுப்பிப்புகள்' },
  'summary.publicAdvisories': { en: 'Public advisories', zh: '公共通告', ms: 'Nasihat awam', ta: 'பொது அறிவுறுத்தல்கள்' },
  'summary.live': { en: 'Live', zh: '实时', ms: 'Langsung', ta: 'நேரடி' },

  // --- AlertFilterBar ---
  'filter.all': { en: 'All', zh: '全部', ms: 'Semua', ta: 'அனைத்தும்' },
  'filter.critical': { en: 'Critical', zh: '紧急', ms: 'Kritikal', ta: 'முக்கியம்' },
  'filter.warning': { en: 'Warning', zh: '警告', ms: 'Amaran', ta: 'எச்சரிக்கை' },
  'filter.advisory': { en: 'Advisory', zh: '通告', ms: 'Nasihat', ta: 'அறிவுறுத்தல்' },
  'filter.info': { en: 'Info', zh: '信息', ms: 'Maklumat', ta: 'தகவல்' },

  // --- AlertSeverityBadge ---
  'severity.critical': { en: 'Critical', zh: '紧急', ms: 'Kritikal', ta: 'முக்கியம்' },
  'severity.warning': { en: 'Warning', zh: '警告', ms: 'Amaran', ta: 'எச்சரிக்கை' },
  'severity.advisory': { en: 'Advisory', zh: '通告', ms: 'Nasihat', ta: 'அறிவுறுத்தல்' },
  'severity.info': { en: 'Info', zh: '信息', ms: 'Maklumat', ta: 'தகவல்' },

  // --- PublicAlertDetailPanel ---
  'alert.whatYouShouldDo': { en: 'WHAT YOU SHOULD DO', zh: '您应该采取的行动', ms: 'APA YANG ANDA PATUT LAKUKAN', ta: 'நீங்கள் செய்ய வேண்டியவை' },
  'alert.audience.public': { en: 'Public', zh: '公共', ms: 'Awam', ta: 'பொது' },
  'alert.audience.zone': { en: '{zone} zone', zh: '{zone} 区域', ms: 'Zon {zone}', ta: '{zone} மண்டலம்' },

  // --- VolunteerPage ---
  'volunteer.sectionLabel': { en: 'VOLUNTEER RESPONSE', zh: '志愿响应', ms: 'TINDAKAN SUKARELAWAN', ta: 'தொண்டர் பதிலளிப்பு' },
  'volunteer.heading': { en: 'Volunteer', zh: '志愿服务', ms: 'Sukarelawan', ta: 'தொண்டர்' },
  'volunteer.subtitle': {
    en: 'Emergency support tasks from verified volunteer organisations.',
    zh: '来自经核实的志愿组织的紧急支援任务。',
    ms: 'Tugas sokongan kecemasan daripada organisasi sukarelawan yang disahkan.',
    ta: 'சரிபார்க்கப்பட்ட தொண்டர் அமைப்புகளிடமிருந்து அவசர ஆதரவு பணிகள்.',
  },
  'volunteer.refresh': { en: 'Refresh', zh: '刷新', ms: 'Muat Semula', ta: 'புதுப்பிக்கவும்' },
  'volunteer.bannerTitle': { en: 'Be part of the response', zh: '参与响应行动', ms: 'Jadilah sebahagian daripada tindakan', ta: 'பதிலளிப்பின் ஒரு பகுதியாக இருங்கள்' },
  'volunteer.bannerDesc': {
    en: 'Sign up for a specific task below, or register your skills with the listed organisation for future deployment.',
    zh: '在下方报名参加特定任务，或向所列组织登记您的技能以备未来部署。',
    ms: 'Daftar untuk tugas tertentu di bawah, atau daftarkan kemahiran anda dengan organisasi yang tersenarai untuk penempatan masa depan.',
    ta: 'கீழே ஒரு குறிப்பிட்ட பணிக்கு பதிவு செய்யவும், அல்லது எதிர்கால நியமனத்திற்கு பட்டியலிடப்பட்ட அமைப்பிடம் உங்கள் திறன்களை பதிவு செய்யவும்.',
  },
  'volunteer.urgentTasks': { en: 'urgent tasks', zh: '紧急任务', ms: 'tugas mendesak', ta: 'அவசர பணிகள்' },
  'volunteer.urgentlyNeeded': { en: 'URGENTLY NEEDED', zh: '急需', ms: 'DIPERLUKAN SEGERA', ta: 'உடனடியாக தேவை' },
  'volunteer.slotsFilled': { en: 'slots filled', ms: 'slot diisi', ta: 'இடங்கள் நிரப்பப்பட்டன', zh: '名额已满' },
  'volunteer.left': { en: 'left', zh: '剩余', ms: 'lagi', ta: 'மீதம்' },
  'volunteer.tapToSignUp': { en: 'Tap to sign up', zh: '点击报名', ms: 'Ketik untuk mendaftar', ta: 'பதிவு செய்ய தட்டவும்' },
  'volunteer.loading': { en: 'Loading volunteer opportunities...', zh: '正在加载志愿机会...', ms: 'Memuatkan peluang sukarelawan...', ta: 'தொண்டர் வாய்ப்புகளை ஏற்றுகிறது...' },
  'volunteer.empty': { en: 'No volunteer opportunities are open.', zh: '目前没有开放的志愿机会。', ms: 'Tiada peluang sukarelawan yang dibuka.', ta: 'தொண்டர் வாய்ப்புகள் எதுவும் திறக்கப்படவில்லை.' },
  'volunteer.error': { en: 'Unable to load volunteer opportunities.', zh: '无法加载志愿机会。', ms: 'Tidak dapat memuatkan peluang sukarelawan.', ta: 'தொண்டர் வாய்ப்புகளை ஏற்ற முடியவில்லை.' },
  'volunteer.noExperience': { en: 'No prior experience', zh: '无需经验', ms: 'Tiada pengalaman diperlukan', ta: 'முன் அனுபவம் தேவையில்லை' },
  'volunteer.trainingPref': { en: 'Training preferred', zh: '优先培训', ms: 'Latihan diutamakan', ta: 'பயிற்சி விரும்பப்படுகிறது' },
  'volunteer.timeTbc': { en: 'Time to be confirmed', zh: '时间待确认', ms: 'Masa akan disahkan', ta: 'நேரம் உறுதி செய்யப்படும்' },
  'volunteer.locationTbc': { en: 'Location to be confirmed', zh: '地点待确认', ms: 'Lokasi akan disahkan', ta: 'இடம் உறுதி செய்யப்படும்' },

  // --- CommunityPage ---
  'community.sectionLabel': { en: 'COMMUNITY RESILIENCE', zh: '社区韧性', ms: 'KETAHANAN KOMUNITI', ta: 'சமூக உறுதிப்பாடு' },
  'community.heading': { en: 'Communities', zh: '社区', ms: 'Komuniti', ta: 'சமூகங்கள்' },
  'community.subtitle': {
    en: 'Workshops, training, and relief activities organised near you.',
    zh: '在您附近组织的工作坊、培训和救助活动。',
    ms: 'Bengkel, latihan, dan aktiviti bantuan yang dianjurkan berhampiran anda.',
    ta: 'உங்கள் அருகில் ஏற்பாடு செய்யப்பட்ட பயிலரங்குகள், பயிற்சி மற்றும் நிவாரண நடவடிக்கைகள்.',
  },
  'community.refresh': { en: 'Refresh', zh: '刷新', ms: 'Muat Semula', ta: 'புதுப்பிக்கவும்' },
  'community.hubTitle': { en: 'Community Resilience Hub', zh: '社区韧性中心', ms: 'Pusat Ketahanan Komuniti', ta: 'சமூக உறுதிப்பாடு மையம்' },
  'community.hubDesc': {
    en: 'Volunteer, train, and support relief activities organised by community groups and agencies near you.',
    zh: '参与社区团体和机构在您附近组织的志愿、培训和救助活动。',
    ms: 'Jadi sukarelawan, berlatih, dan sokong aktiviti bantuan yang dianjurkan oleh kumpulan komuniti dan agensi berhampiran anda.',
    ta: 'உங்கள் அருகில் உள்ள சமூக குழுக்கள் மற்றும் நிறுவனங்களால் ஏற்பாடு செய்யப்பட்ட நிவாரண நடவடிக்கைகளுக்கு தொண்டராகச் செய்யுங்கள், பயிற்சி பெறுங்கள் மற்றும் ஆதரவு அளியுங்கள்.',
  },
  'community.filterAll': { en: 'All', zh: '全部', ms: 'Semua', ta: 'அனைத்தும்' },
  'community.filterPreparedness': { en: 'Preparedness', zh: '防范', ms: 'Kesiapsiagaan', ta: 'தயார்நிலை' },
  'community.filterRelief': { en: 'Relief', zh: '救助', ms: 'Bantuan', ta: 'நிவாரணம்' },
  'community.filterTraining': { en: 'Training', zh: '培训', ms: 'Latihan', ta: 'பயிற்சி' },
  'community.registered': { en: 'registered', zh: '已注册', ms: 'berdaftar', ta: 'பதிவு செய்யப்பட்டது' },
  'community.spotsLeft': { en: 'spots left', zh: '剩余名额', ms: 'tempat lagi', ta: 'இடங்கள் மீதம்' },
  'community.tapToRegister': { en: 'Tap to view and register', zh: '点击查看并注册', ms: 'Ketik untuk melihat dan mendaftar', ta: 'காண மற்றும் பதிவு செய்ய தட்டவும்' },
  'community.free': { en: 'Free', zh: '免费', ms: 'Percuma', ta: 'இலவசம்' },
  'community.paid': { en: 'Paid', zh: '收费', ms: 'Berbayar', ta: 'கட்டணம்' },
  'community.loading': { en: 'Loading community events...', zh: '正在加载社区活动...', ms: 'Memuatkan acara komuniti...', ta: 'சமூக நிகழ்வுகளை ஏற்றுகிறது...' },
  'community.empty': { en: 'No community events found.', zh: '未找到社区活动。', ms: 'Tiada acara komuniti ditemui.', ta: 'சமூக நிகழ்வுகள் எதுவும் காணப்படவில்லை.' },
  'community.error': { en: 'Unable to load community events.', zh: '无法加载社区活动。', ms: 'Tidak dapat memuatkan acara komuniti.', ta: 'சமூக நிகழ்வுகளை ஏற்ற முடியவில்லை.' },
  'community.timeTbc': { en: 'Time to be confirmed', zh: '时间待确认', ms: 'Masa akan disahkan', ta: 'நேரம் உறுதி செய்யப்படும்' },
  'community.locationTbc': { en: 'Location to be confirmed', zh: '地点待确认', ms: 'Lokasi akan disahkan', ta: 'இடம் உறுதி செய்யப்படும்' },

  // --- ReportPage ---
  'report.sectionLabel': { en: 'OFFICIAL CONTACT GUIDANCE', zh: '官方联系指南', ms: 'PANDUAN HUBUNGI RASMI', ta: 'அதிகாரப்பூர்வ தொடர்பு வழிகாட்டி' },
  'report.heading': { en: 'Report', zh: '报告', ms: 'Lapor', ta: 'அறிவிக்க' },
  'report.subtitle': {
    en: 'Find the right organisation to contact for emergency and public service issues.',
    zh: '查找合适的机构联系处理紧急和公共服务问题。',
    ms: 'Cari organisasi yang betul untuk dihubungi mengenai isu kecemasan dan perkhidmatan awam.',
    ta: 'அவசர மற்றும் பொது சேவை சிக்கல்களுக்கு தொடர்பு கொள்ள சரியான அமைப்பைக் கண்டறியவும்.',
  },
  'report.refresh': { en: 'Refresh', zh: '刷新', ms: 'Muat Semula', ta: 'புதுப்பிக்கவும்' },
  'report.directoryTitle': { en: 'Organisation directory', zh: '机构目录', ms: 'Direktori organisasi', ta: 'அமைப்பு அடைவு' },
  'report.guidesAvailable': { en: '{count} contact guides available', zh: '{count} 个联系指南可用', ms: '{count} panduan hubungan tersedia', ta: '{count} தொடர்பு வழிகாட்டிகள் உள்ளன' },
  'report.guideAvailable': { en: '{count} contact guide available', zh: '{count} 个联系指南可用', ms: '{count} panduan hubungan tersedia', ta: '{count} தொடர்பு வழிகாட்டி உள்ளது' },
  'report.searchPlaceholder': { en: 'Search by organisation or issue', zh: '按机构或问题搜索', ms: 'Cari mengikut organisasi atau isu', ta: 'அமைப்பு அல்லது சிக்கல் மூலம் தேடவும்' },
  'report.loading': { en: 'Loading organisation guides...', zh: '正在加载机构指南...', ms: 'Memuatkan panduan organisasi...', ta: 'அமைப்பு வழிகாட்டிகளை ஏற்றுகிறது...' },
  'report.empty': { en: 'No organisation guides match this search.', zh: '没有与此搜索匹配的机构指南。', ms: 'Tiada panduan organisasi sepadan dengan carian ini.', ta: 'இந்த தேடலுடன் பொருந்தும் அமைப்பு வழிகாட்டிகள் இல்லை.' },
  'report.contact': { en: 'Contact', zh: '联系', ms: 'Hubungi', ta: 'தொடர்பு' },

  // --- Organisation tones (from organisationDisplay.ts) ---
  'org.emergency': { en: 'Emergency', zh: '紧急', ms: 'Kecemasan', ta: 'அவசரம்' },
  'org.police': { en: 'Police', zh: '警察', ms: 'Polis', ta: 'காவல்துறை' },
  'org.health': { en: 'Health', zh: '卫生', ms: 'Kesihatan', ta: 'சுகாதாரம்' },
  'org.hospital': { en: 'Hospital', zh: '医院', ms: 'Hospital', ta: 'மருத்துவமனை' },
  'org.healthcare': { en: 'Healthcare', zh: '医疗', ms: 'Penjagaan kesihatan', ta: 'சுகாதார சேவை' },
  'org.water': { en: 'Water', zh: '水务', ms: 'Air', ta: 'நீர்' },
  'org.environment': { en: 'Environment', zh: '环境', ms: 'Alam sekitar', ta: 'சுற்றுச்சூழல்' },
  'org.transport': { en: 'Transport', zh: '交通', ms: 'Pengangkutan', ta: 'போக்குவரத்து' },
  'org.housing': { en: 'Housing', zh: '住房', ms: 'Perumahan', ta: 'வீடமைப்பு' },
  'org.energy': { en: 'Energy', zh: '能源', ms: 'Tenaga', ta: 'ஆற்றல்' },
  'org.municipal': { en: 'Municipal', zh: '市政', ms: 'Perbandaran', ta: 'நகராட்சி' },
  'org.service': { en: 'Service', zh: '服务', ms: 'Perkhidmatan', ta: 'சேவை' },

  // --- ProfilePage ---
  'profile.heading': { en: 'Profile', zh: '个人资料', ms: 'Profil', ta: 'சுயம்' },
  'profile.placeholder': { en: 'This page is ready for public account and contact preferences.', zh: '此页面已准备好用于公共账户和联系偏好设置。', ms: 'Halaman ini sedia untuk akaun awam dan keutamaan hubungan.', ta: 'இந்தப் பக்கம் பொதுக் கணக்கு மற்றும் தொடர்பு விருப்பங்களுக்கு தயாராக உள்ளது.' },
}
