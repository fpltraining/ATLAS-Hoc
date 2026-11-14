/* Nội dung phòng tiếng Anh cấp A1. Mỗi phòng: giáo viên, lời mở đầu, các mục học.
   Mục: en (tiếng Anh), vi (nghĩa), ex (câu ví dụ), exVi (nghĩa câu ví dụ). */
var G = window.G || (window.G = {});

G.ROOMS = G.ROOMS || {};

G.ROOMS['en-a1-1'] = {
  id: 'en-a1-1',
  lang: 'en',
  title: 'A1-1 · Chào hỏi và giới thiệu',
  teacher: 'emma',
  intro: [
    'Hello! I am Ms. Emma. Welcome to Brightford!',
    'Hôm nay mình học cách chào hỏi và giới thiệu bản thân. Bấm 🔊 để nghe, rồi nói theo nhé.'
  ],
  items: [
    { en: 'hello', vi: 'xin chào', ex: 'Hello, I am Han.', exVi: 'Xin chào, mình là Han.' },
    { en: 'good morning', vi: 'chào buổi sáng', ex: 'Good morning, Ms. Emma!', exVi: 'Chào buổi sáng, cô Emma!' },
    { en: 'good afternoon', vi: 'chào buổi chiều', ex: 'Good afternoon, everyone.', exVi: 'Chào buổi chiều mọi người.' },
    { en: 'good evening', vi: 'chào buổi tối', ex: 'Good evening, Mr. Tom.', exVi: 'Chào buổi tối, thầy Tom.' },
    { en: 'goodbye', vi: 'tạm biệt', ex: 'Goodbye, see you tomorrow!', exVi: 'Tạm biệt, mai gặp lại nhé!' },
    { en: 'see you later', vi: 'hẹn gặp lại', ex: 'See you later, Kai!', exVi: 'Hẹn gặp lại nhé, Kai!' },
    { en: 'What is your name?', vi: 'Bạn tên là gì?', ex: 'Hi! What is your name?', exVi: 'Chào bạn! Bạn tên là gì?' },
    { en: 'My name is Han.', vi: 'Mình tên là Han.', ex: 'Hello, my name is Han.', exVi: 'Xin chào, mình tên là Han.' },
    { en: 'nice to meet you', vi: 'rất vui được gặp bạn', ex: 'Nice to meet you, Emma.', exVi: 'Rất vui được gặp cô, Emma.' },
    { en: 'How are you?', vi: 'Bạn có khoẻ không?', ex: 'Hi Tom, how are you?', exVi: 'Chào Tom, cậu khoẻ không?' },
    { en: 'I am fine, thank you.', vi: 'Mình khoẻ, cảm ơn.', ex: 'I am fine, thank you. And you?', exVi: 'Mình khoẻ, cảm ơn. Còn bạn?' },
    { en: 'I am from Vietnam.', vi: 'Mình đến từ Việt Nam.', ex: 'I am from Vietnam. I live in Hanoi.', exVi: 'Mình đến từ Việt Nam. Mình sống ở Hà Nội.' }
  ],
  outro: 'Great job! You can say hello in English now.'
};
