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

G.ROOMS['en-a1-2'] = {
  id: 'en-a1-2',
  lang: 'en',
  title: 'A1-2 · Số, giờ và ngày',
  teacher: 'tom',
  intro: [
    'Good morning! I am Mr. Tom. Let us learn numbers and time.',
    'Hôm nay học số, hỏi giờ và các ngày trong tuần. Nghe kỹ cách đọc giờ nhé.'
  ],
  items: [
    { en: 'one', vi: 'một', ex: 'I have one brother.', exVi: 'Mình có một anh trai.' },
    { en: 'five', vi: 'năm', ex: 'I have five books.', exVi: 'Mình có năm quyển sách.' },
    { en: 'ten', vi: 'mười', ex: 'There are ten students in the class.', exVi: 'Lớp có mười học sinh.' },
    { en: 'twenty', vi: 'hai mươi', ex: 'I am twenty years old.', exVi: 'Mình hai mươi tuổi.' },
    { en: 'How old are you?', vi: 'Bạn bao nhiêu tuổi?', ex: 'Hi Kai, how old are you?', exVi: 'Chào Kai, bạn bao nhiêu tuổi?' },
    { en: 'What time is it?', vi: 'Mấy giờ rồi?', ex: 'Excuse me, what time is it?', exVi: 'Xin lỗi, mấy giờ rồi ạ?' },
    { en: 'seven o\'clock', vi: 'bảy giờ đúng', ex: 'It is seven o\'clock in the morning.', exVi: 'Bây giờ là bảy giờ sáng.' },
    { en: 'half past eight', vi: 'tám giờ rưỡi', ex: 'The class starts at half past eight.', exVi: 'Lớp học bắt đầu lúc tám giờ rưỡi.' },
    { en: 'Monday', vi: 'thứ Hai', ex: 'I go to school on Monday.', exVi: 'Mình đi học vào thứ Hai.' },
    { en: 'Sunday', vi: 'Chủ nhật', ex: 'We rest on Sunday.', exVi: 'Chúng mình nghỉ vào Chủ nhật.' },
    { en: 'today', vi: 'hôm nay', ex: 'Today is Friday.', exVi: 'Hôm nay là thứ Sáu.' },
    { en: 'tomorrow', vi: 'ngày mai', ex: 'See you tomorrow, Mr. Tom!', exVi: 'Hẹn gặp thầy Tom ngày mai!' }
  ],
  outro: 'Excellent! Now you can tell the time in English.'
};

G.ROOMS['en-a1-3'] = {
  id: 'en-a1-3',
  lang: 'en',
  title: 'A1-3 · Gia đình và mọi người',
  teacher: 'lily',
  intro: [
    'Hello, dear! I am Mrs. Lily. Tell me about your family.',
    'Hôm nay học cách nói về gia đình và tả người. Bấm 🔊 rồi nói theo nhé.'
  ],
  items: [
    { en: 'family', vi: 'gia đình', ex: 'I love my family.', exVi: 'Mình yêu gia đình mình.' },
    { en: 'mother', vi: 'mẹ', ex: 'My mother is a teacher.', exVi: 'Mẹ mình là giáo viên.' },
    { en: 'father', vi: 'bố', ex: 'My father likes coffee.', exVi: 'Bố mình thích cà phê.' },
    { en: 'brother', vi: 'anh trai, em trai', ex: 'My brother is ten years old.', exVi: 'Em trai mình mười tuổi.' },
    { en: 'sister', vi: 'chị gái, em gái', ex: 'My sister likes music.', exVi: 'Chị gái mình thích âm nhạc.' },
    { en: 'grandmother', vi: 'bà', ex: 'My grandmother lives with us.', exVi: 'Bà sống cùng nhà mình.' },
    { en: 'grandfather', vi: 'ông', ex: 'My grandfather tells funny stories.', exVi: 'Ông mình kể chuyện rất vui.' },
    { en: 'friend', vi: 'bạn', ex: 'Kai is my best friend.', exVi: 'Kai là bạn thân nhất của mình.' },
    { en: 'This is my mother.', vi: 'Đây là mẹ mình.', ex: 'Hello! This is my mother.', exVi: 'Xin chào! Đây là mẹ mình.' },
    { en: 'He is tall.', vi: 'Anh ấy cao.', ex: 'My father is tall and strong.', exVi: 'Bố mình cao và khoẻ.' },
    { en: 'She is kind.', vi: 'Cô ấy tốt bụng.', ex: 'She is kind and funny.', exVi: 'Cô ấy tốt bụng và vui tính.' },
    { en: 'Do you have any brothers?', vi: 'Bạn có anh em trai không?', ex: 'Do you have any brothers or sisters?', exVi: 'Bạn có anh chị em không?' }
  ],
  outro: 'Wonderful! You can talk about your family now.'
};

G.ROOMS['en-a1-4'] = {
  id: 'en-a1-4',
  lang: 'en',
  title: 'A1-4 · Đồ ăn và đồ uống',
  teacher: 'sam',
  intro: [
    'Hi there! I am Chef Sam. Are you hungry?',
    'Hôm nay học tên đồ ăn, đồ uống và cách gọi món. Học xong là đủ sức ra quán cà phê đấy!'
  ],
  items: [
    { en: 'water', vi: 'nước', ex: 'Can I have some water, please?', exVi: 'Cho mình xin ít nước được không?' },
    { en: 'coffee', vi: 'cà phê', ex: 'I drink coffee every morning.', exVi: 'Sáng nào mình cũng uống cà phê.' },
    { en: 'tea', vi: 'trà', ex: 'Would you like some tea?', exVi: 'Bạn có muốn uống chút trà không?' },
    { en: 'bread', vi: 'bánh mì', ex: 'I eat bread for breakfast.', exVi: 'Bữa sáng mình ăn bánh mì.' },
    { en: 'rice', vi: 'cơm, gạo', ex: 'We eat rice for dinner.', exVi: 'Bữa tối chúng mình ăn cơm.' },
    { en: 'apple', vi: 'quả táo', ex: 'This apple is very sweet.', exVi: 'Quả táo này ngọt lắm.' },
    { en: 'chicken', vi: 'thịt gà', ex: 'I like chicken soup.', exVi: 'Mình thích súp gà.' },
    { en: 'breakfast', vi: 'bữa sáng', ex: 'I have breakfast at seven.', exVi: 'Mình ăn sáng lúc bảy giờ.' },
    { en: 'delicious', vi: 'ngon', ex: 'This soup is delicious!', exVi: 'Món súp này ngon quá!' },
    { en: 'I am hungry.', vi: 'Mình đói.', ex: 'I am hungry. Let us eat!', exVi: 'Mình đói rồi. Đi ăn thôi!' },
    { en: 'I am thirsty.', vi: 'Mình khát.', ex: 'I am thirsty. I want some water.', exVi: 'Mình khát. Mình muốn uống nước.' },
    { en: 'I would like a sandwich.', vi: 'Mình muốn một cái bánh mì kẹp.', ex: 'I would like a sandwich, please.', exVi: 'Cho mình một cái bánh mì kẹp nhé.' }
  ],
  outro: 'Yummy! You can order food in English now.'
};

/* Phòng thi cuối cấp A1: trộn câu của cả 4 phòng, 20 câu, đạt từ 16 câu là tốt nghiệp */
G.ROOMS['en-a1-test'] = {
  id: 'en-a1-test',
  lang: 'en',
  title: 'Thi cuối cấp A1',
  teacher: 'kai',
  final: { lang: 'en', level: 'A1' },
  testN: 20,
  passN: 16,
  intro: [
    'Welcome to the A1 final test! I am Kai, the principal.',
    'Đây là bài thi cuối cấp A1: 20 câu lấy từ cả 4 phòng. Đúng từ 16 câu là tốt nghiệp và nhận bằng A1.'
  ],
  items: [].concat(G.ROOMS['en-a1-1'].items, G.ROOMS['en-a1-2'].items, G.ROOMS['en-a1-3'].items, G.ROOMS['en-a1-4'].items),
  outro: 'Congratulations! You passed A1!'
};
