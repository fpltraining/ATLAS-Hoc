/* Khu đời sống (tiếng Anh; phần tiếng Trung tạm dừng): mỗi nơi 3 tình huống, mỗi tình huống 5 lượt. NPC nói, người chơi chọn câu đáp đúng.
   Câu sai: lấy ngẫu nhiên từ câu đáp của nơi khác cùng ngôn ngữ. {name} = tên nhân vật.
   Tiếng Trung: npc = [chữ Hán, pinyin], ok = [chữ Hán, pinyin]. */
var G = window.G || (window.G = {});

G.LIFE = {
  'en-cafe': {
    lang: 'en', title: 'Quán cà phê của Leo', npc: 'leo', scene: 'cafe_en', unlock: 'en-a1-4', unlockText: 'Qua phòng A1-4 (đồ ăn, đồ uống) để mở quán cà phê.',
    souvenir: { img: 'souvenir_coffee.png', name: 'Ly cà phê của Leo' },
    talks: [
      { title: 'Gọi đồ uống', turns: [
        { npc: 'Hi! Welcome to Leo\'s Café. What can I get for you?', vi: 'Chào! Chào mừng tới quán của Leo. Bạn dùng gì?', ok: 'A coffee, please.' },
        { npc: 'Sure! Hot or iced?', vi: 'Được! Nóng hay đá?', ok: 'Iced, please.' },
        { npc: 'What size? Small, medium or large?', vi: 'Cỡ nào? Nhỏ, vừa hay lớn?', ok: 'Medium, please.' },
        { npc: 'Anything else?', vi: 'Bạn cần gì nữa không?', ok: 'No, thank you.' },
        { npc: 'That is four dollars, please.', vi: 'Của bạn bốn đô la.', ok: 'Here you go.' }
      ] },
      { title: 'Gọi đồ ăn', turns: [
        { npc: 'Good afternoon! Are you hungry?', vi: 'Chào buổi chiều! Bạn đói không?', ok: 'Yes, I am very hungry.' },
        { npc: 'We have sandwiches, cakes and soup.', vi: 'Quán có bánh mì kẹp, bánh ngọt và súp.', ok: 'I would like a sandwich, please.' },
        { npc: 'Chicken or egg sandwich?', vi: 'Bánh kẹp gà hay trứng?', ok: 'Chicken, please.' },
        { npc: 'Would you like a drink with that?', vi: 'Bạn có muốn uống gì kèm không?', ok: 'Some water, please.' },
        { npc: 'Is it for here or to go?', vi: 'Ăn ở đây hay mang đi?', ok: 'For here, please.' }
      ] },
      { title: 'Trò chuyện với Leo', turns: [
        { npc: 'Hey, I have not seen you before. What is your name?', vi: 'Ơ, trước giờ chưa gặp bạn. Bạn tên gì?', ok: 'My name is {name}.' },
        { npc: 'Nice to meet you! Where are you from?', vi: 'Rất vui được gặp! Bạn từ đâu tới?', ok: 'I am from Vietnam.' },
        { npc: 'Cool! Do you study here?', vi: 'Hay quá! Bạn học ở đây à?', ok: 'Yes, I study at Brightford High School.' },
        { npc: 'What time do your classes start?', vi: 'Lớp của bạn bắt đầu lúc mấy giờ?', ok: 'At half past eight.' },
        { npc: 'Come back tomorrow. I will make you a special coffee!', vi: 'Mai ghé nhé. Mình sẽ pha cho bạn một ly đặc biệt!', ok: 'Thank you! See you tomorrow!' }
      ] }
    ]
  },
  'en-market': {
    lang: 'en', title: 'Chợ nông sản', npc: 'rosa', scene: 'market_en', unlock: 'en-a1-2', unlockText: 'Qua phòng A1-2 (số, giờ) để mở chợ.',
    souvenir: { img: 'souvenir_apples.png', name: 'Túi táo của Mrs. Rosa' },
    talks: [
      { title: 'Mua táo', turns: [
        { npc: 'Good morning, dear! Fresh fruit today!', vi: 'Chào cháu! Hôm nay hoa quả tươi lắm!', ok: 'Good morning! I would like some apples.' },
        { npc: 'How many apples?', vi: 'Lấy mấy quả táo?', ok: 'Five apples, please.' },
        { npc: 'Red or green?', vi: 'Táo đỏ hay táo xanh?', ok: 'Red, please.' },
        { npc: 'Here you are. Anything else?', vi: 'Của cháu đây. Còn gì nữa không?', ok: 'No, thank you. How much is it?' },
        { npc: 'That is three dollars.', vi: 'Ba đô la.', ok: 'Here you are.' }
      ] },
      { title: 'Hỏi giá', turns: [
        { npc: 'These oranges are very sweet!', vi: 'Cam này ngọt lắm đấy!', ok: 'How much are the oranges?' },
        { npc: 'One dollar each.', vi: 'Một đô một quả.', ok: 'Two oranges, please.' },
        { npc: 'Do you need a bag?', vi: 'Cháu cần túi không?', ok: 'Yes, please.' },
        { npc: 'That is two dollars.', vi: 'Hai đô la.', ok: 'Here is two dollars.' },
        { npc: 'Thank you, dear! Have a nice day!', vi: 'Cảm ơn cháu! Chúc một ngày vui!', ok: 'You too! Goodbye!' }
      ] },
      { title: 'Mua hoa tặng mẹ', turns: [
        { npc: 'Flowers for someone special?', vi: 'Mua hoa tặng ai đặc biệt à?', ok: 'Yes, for my mother.' },
        { npc: 'Lovely! Roses or sunflowers?', vi: 'Dễ thương quá! Hoa hồng hay hướng dương?', ok: 'Sunflowers, please. She likes yellow.' },
        { npc: 'How many?', vi: 'Mấy bông?', ok: 'Ten, please.' },
        { npc: 'Shall I wrap them for you?', vi: 'Bà gói lại cho cháu nhé?', ok: 'Yes, please. Thank you.' },
        { npc: 'Your mother is a lucky woman!', vi: 'Mẹ cháu thật may mắn!', ok: 'Thank you, Mrs. Rosa!' }
      ] }
    ]
  },
  'en-hospital': {
    lang: 'en', title: 'Bệnh viện Brightford', npc: 'anna', scene: 'hospital_en', unlock: 'en-a1-test', unlockText: 'Tốt nghiệp A1 để mở bệnh viện (tình huống khó hơn).',
    souvenir: { img: 'souvenir_medkit.png', name: 'Hộp cứu thương' },
    talks: [
      { title: 'Đau đầu', turns: [
        { npc: 'Hello, come in. What is the matter?', vi: 'Chào bạn, vào đi. Bạn bị sao?', ok: 'I have a headache.' },
        { npc: 'When did it start?', vi: 'Bắt đầu từ khi nào?', ok: 'Yesterday evening.' },
        { npc: 'Do you have a fever?', vi: 'Bạn có sốt không?', ok: 'No, I do not.' },
        { npc: 'Drink more water and rest well.', vi: 'Uống nhiều nước và nghỉ ngơi nhé.', ok: 'Okay, I will.' },
        { npc: 'Take this medicine after meals.', vi: 'Uống thuốc này sau bữa ăn.', ok: 'Thank you, doctor.' }
      ] },
      { title: 'Đau bụng', turns: [
        { npc: 'Good morning. How can I help you?', vi: 'Chào buổi sáng. Tôi giúp gì được bạn?', ok: 'I have a stomachache.' },
        { npc: 'What did you eat yesterday?', vi: 'Hôm qua bạn ăn gì?', ok: 'I ate chicken soup.' },
        { npc: 'Does it hurt here?', vi: 'Đau ở đây không?', ok: 'Yes, it hurts a lot.' },
        { npc: 'Do not eat spicy food for two days.', vi: 'Hai ngày đừng ăn đồ cay nhé.', ok: 'Okay. Can I drink tea?' },
        { npc: 'Yes, warm tea is fine. Get well soon!', vi: 'Được, trà ấm thì được. Mau khỏi nhé!', ok: 'Thank you very much!' }
      ] },
      { title: 'Bị cảm', turns: [
        { npc: 'You look tired. Are you okay?', vi: 'Trông bạn mệt quá. Bạn ổn không?', ok: 'I have a cold.' },
        { npc: 'Do you have a sore throat?', vi: 'Bạn có đau họng không?', ok: 'Yes, I do.' },
        { npc: 'Your temperature is a little high.', vi: 'Nhiệt độ của bạn hơi cao.', ok: 'Should I stay home?' },
        { npc: 'Yes, stay home tomorrow and sleep a lot.', vi: 'Ừ, mai ở nhà và ngủ nhiều vào.', ok: 'Okay, I will rest.' },
        { npc: 'Come back if you feel worse.', vi: 'Thấy tệ hơn thì quay lại nhé.', ok: 'Thank you, Dr. Anna. Goodbye!' }
      ] }
    ]
  }

};
