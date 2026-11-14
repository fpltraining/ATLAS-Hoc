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
    'Hey! I\'m Ms. Emma. Welcome to Brightford!',
    'Hôm nay học cách chào hỏi như người Mỹ nói thật ngoài đời: ngắn, thoải mái, có rút gọn (I\'m, what\'s…). Bấm 🔊 rồi nói theo nhé.'
  ],
  items: [
    { en: 'Hey!', vi: 'Chào! (thân mật, dùng nhiều nhất)', ex: 'Hey! What\'s up?', exVi: 'Chào! Có gì mới không?' },
    { en: 'Morning!', vi: 'Chào buổi sáng! (nói gọn)', ex: 'Morning, Ms. Emma!', exVi: 'Chào buổi sáng cô Emma!' },
    { en: 'How\'s it going?', vi: 'Dạo này sao rồi?', ex: 'Hey Tom, how\'s it going?', exVi: 'Chào Tom, dạo này sao rồi?' },
    { en: 'Not bad, you?', vi: 'Cũng ổn, còn bạn?', ex: 'Not bad, you? Busy day?', exVi: 'Cũng ổn, còn bạn? Hôm nay bận không?' },
    { en: 'Pretty good, thanks.', vi: 'Khá ổn, cảm ơn.', ex: 'Pretty good, thanks for asking.', exVi: 'Khá ổn, cảm ơn đã hỏi.' },
    { en: 'What\'s your name?', vi: 'Bạn tên gì?', ex: 'Sorry, what\'s your name again?', exVi: 'Xin lỗi, bạn tên gì nhỉ?' },
    { en: 'I\'m Han.', vi: 'Mình là Han.', ex: 'Hi, I\'m Han. I\'m new here.', exVi: 'Chào, mình là Han. Mình mới tới.' },
    { en: 'Nice to meet you.', vi: 'Rất vui được gặp bạn.', ex: 'Nice to meet you too!', exVi: 'Mình cũng rất vui được gặp bạn!' },
    { en: 'Where are you from?', vi: 'Bạn từ đâu tới?', ex: 'So, where are you from?', exVi: 'Vậy bạn từ đâu tới?' },
    { en: 'I\'m from Vietnam.', vi: 'Mình đến từ Việt Nam.', ex: 'I\'m from Vietnam. Hanoi, actually.', exVi: 'Mình từ Việt Nam. Hà Nội cơ.' },
    { en: 'See you later!', vi: 'Gặp lại sau nhé!', ex: 'Gotta go. See you later!', exVi: 'Mình phải đi rồi. Gặp lại sau nhé!' },
    { en: 'Take care!', vi: 'Giữ gìn sức khoẻ nhé! (lời chào khi chia tay)', ex: 'Bye, take care!', exVi: 'Tạm biệt, giữ gìn nhé!' }
  ],
  outro: 'Awesome! You sound like a local already.'
};

G.ROOMS['en-a1-2'] = {
  id: 'en-a1-2',
  lang: 'en',
  title: 'A1-2 · Số, giờ và ngày',
  teacher: 'tom',
  intro: [
    'Morning! I\'m Mr. Tom. Let\'s talk numbers and time.',
    'Hôm nay học hỏi giờ, nói tuổi, ngày trong tuần đúng kiểu người bản xứ hay nói.'
  ],
  items: [
    { en: 'What time is it?', vi: 'Mấy giờ rồi?', ex: 'Hey, what time is it?', exVi: 'Ê, mấy giờ rồi?' },
    { en: 'It\'s seven o\'clock.', vi: 'Bảy giờ đúng.', ex: 'It\'s seven o\'clock. Time to get up!', exVi: 'Bảy giờ rồi. Dậy thôi!' },
    { en: 'It\'s eight thirty.', vi: 'Tám giờ rưỡi.', ex: 'Class starts at eight thirty.', exVi: 'Lớp bắt đầu lúc tám giờ rưỡi.' },
    { en: 'quarter to nine', vi: 'chín giờ kém mười lăm', ex: 'It\'s quarter to nine. We\'re late!', exVi: 'Chín giờ kém mười lăm rồi. Muộn rồi!' },
    { en: 'How old are you?', vi: 'Bạn bao nhiêu tuổi?', ex: 'If you don\'t mind me asking, how old are you?', exVi: 'Nếu bạn không phiền, bạn bao nhiêu tuổi?' },
    { en: 'I\'m twenty.', vi: 'Mình hai mươi tuổi.', ex: 'I\'m twenty. I just had my birthday.', exVi: 'Mình hai mươi. Mình vừa sinh nhật xong.' },
    { en: 'What day is it today?', vi: 'Hôm nay thứ mấy?', ex: 'Wait, what day is it today?', exVi: 'Khoan, hôm nay thứ mấy nhỉ?' },
    { en: 'It\'s Monday.', vi: 'Thứ Hai.', ex: 'Ugh, it\'s Monday again.', exVi: 'Haizz, lại thứ Hai rồi.' },
    { en: 'this weekend', vi: 'cuối tuần này', ex: 'Are you free this weekend?', exVi: 'Cuối tuần này bạn rảnh không?' },
    { en: 'tomorrow', vi: 'ngày mai', ex: 'See you tomorrow, Mr. Tom!', exVi: 'Mai gặp thầy Tom nhé!' },
    { en: 'in five minutes', vi: 'năm phút nữa', ex: 'I\'ll be there in five minutes.', exVi: 'Năm phút nữa mình tới.' },
    { en: 'I\'m running late.', vi: 'Mình bị trễ rồi.', ex: 'Sorry, I\'m running late. Traffic is crazy.', exVi: 'Xin lỗi, mình trễ rồi. Kẹt xe kinh khủng.' }
  ],
  outro: 'Nice! Now you\'ll never be late again.'
};

G.ROOMS['en-a1-3'] = {
  id: 'en-a1-3',
  lang: 'en',
  title: 'A1-3 · Gia đình và mọi người',
  teacher: 'lily',
  intro: [
    'Hi, sweetie! I\'m Mrs. Lily. Tell me about your family.',
    'Hôm nay học nói về gia đình như người Mỹ hay nói: mom, dad, grandma… chứ ít ai nói mother, father khi trò chuyện.'
  ],
  items: [
    { en: 'my mom', vi: 'mẹ mình', ex: 'My mom is a teacher.', exVi: 'Mẹ mình là giáo viên.' },
    { en: 'my dad', vi: 'bố mình', ex: 'My dad loves coffee.', exVi: 'Bố mình mê cà phê.' },
    { en: 'my brother', vi: 'anh / em trai mình', ex: 'My little brother is ten.', exVi: 'Em trai mình mười tuổi.' },
    { en: 'my sister', vi: 'chị / em gái mình', ex: 'My big sister lives in Saigon.', exVi: 'Chị gái mình sống ở Sài Gòn.' },
    { en: 'my grandma', vi: 'bà mình', ex: 'My grandma lives with us.', exVi: 'Bà mình sống cùng nhà.' },
    { en: 'my grandpa', vi: 'ông mình', ex: 'My grandpa tells the best stories.', exVi: 'Ông mình kể chuyện hay nhất.' },
    { en: 'my best friend', vi: 'bạn thân nhất của mình', ex: 'Kai is my best friend.', exVi: 'Kai là bạn thân nhất của mình.' },
    { en: 'This is my mom.', vi: 'Đây là mẹ mình.', ex: 'Hey, this is my mom.', exVi: 'Ê, đây là mẹ mình nè.' },
    { en: 'Do you have any siblings?', vi: 'Bạn có anh chị em không?', ex: 'So, do you have any siblings?', exVi: 'Vậy bạn có anh chị em không?' },
    { en: 'I\'m an only child.', vi: 'Mình là con một.', ex: 'No, I\'m an only child.', exVi: 'Không, mình là con một.' },
    { en: 'He\'s really tall.', vi: 'Anh ấy cao lắm.', ex: 'My dad\'s really tall.', exVi: 'Bố mình cao lắm.' },
    { en: 'She\'s super nice.', vi: 'Cô ấy cực kỳ dễ thương.', ex: 'Your sister\'s super nice!', exVi: 'Chị bạn dễ thương ghê!' }
  ],
  outro: 'So sweet! Now you can talk about your family.'
};

G.ROOMS['en-a1-4'] = {
  id: 'en-a1-4',
  lang: 'en',
  title: 'A1-4 · Đồ ăn và đồ uống',
  teacher: 'sam',
  intro: [
    'Hey there! I\'m Chef Sam. Hungry yet?',
    'Hôm nay học gọi món như ngoài quán thật: Can I get…, for here or to go… Học xong là đủ sức ra quán cà phê đấy!'
  ],
  items: [
    { en: 'I\'m starving.', vi: 'Mình đói muốn xỉu.', ex: 'I\'m starving. Let\'s grab lunch.', exVi: 'Đói quá. Đi ăn trưa đi.' },
    { en: 'I\'m so thirsty.', vi: 'Mình khát quá.', ex: 'I\'m so thirsty. Is there any water?', exVi: 'Khát quá. Có nước không?' },
    { en: 'Can I get a coffee?', vi: 'Cho mình một ly cà phê.', ex: 'Hi, can I get a coffee, please?', exVi: 'Chào, cho mình một ly cà phê nhé.' },
    { en: 'an iced latte', vi: 'một ly latte đá', ex: 'Can I get an iced latte?', exVi: 'Cho mình một latte đá.' },
    { en: 'I\'ll have the chicken.', vi: 'Mình gọi món gà.', ex: 'I\'ll have the chicken, please.', exVi: 'Cho mình món gà nhé.' },
    { en: 'For here or to go?', vi: 'Ăn ở đây hay mang đi?', ex: 'Is that for here or to go?', exVi: 'Ăn ở đây hay mang đi ạ?' },
    { en: 'To go, please.', vi: 'Mang đi nhé.', ex: 'To go, please. I\'m in a hurry.', exVi: 'Mang đi nhé. Mình đang vội.' },
    { en: 'Anything else?', vi: 'Còn gì nữa không?', ex: 'Great. Anything else?', exVi: 'Được rồi. Còn gì nữa không?' },
    { en: 'That\'s it, thanks.', vi: 'Vậy thôi, cảm ơn.', ex: 'No, that\'s it, thanks.', exVi: 'Không, vậy thôi, cảm ơn.' },
    { en: 'This is so good!', vi: 'Ngon quá!', ex: 'Wow, this is so good!', exVi: 'Trời, ngon quá!' },
    { en: 'breakfast', vi: 'bữa sáng', ex: 'What did you have for breakfast?', exVi: 'Sáng nay bạn ăn gì?' },
    { en: 'Can I get the check?', vi: 'Cho mình tính tiền.', ex: 'Excuse me, can I get the check?', exVi: 'Xin lỗi, cho mình tính tiền.' }
  ],
  outro: 'Yum! You\'re ready to order anywhere.'
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
    'Welcome to the A1 final! I\'m Kai, the principal. You got this!',
    'Đây là bài thi cuối cấp A1: 20 câu lấy từ cả 4 phòng. Đúng từ 16 câu là tốt nghiệp và nhận bằng A1.'
  ],
  items: [].concat(G.ROOMS['en-a1-1'].items, G.ROOMS['en-a1-2'].items, G.ROOMS['en-a1-3'].items, G.ROOMS['en-a1-4'].items),
  outro: 'You did it! You passed A1!'
};
