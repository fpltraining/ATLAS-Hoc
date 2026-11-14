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
        { npc: 'Hey! What can I get you?', vi: 'Chào! Bạn dùng gì?', ok: 'Can I get an iced latte?' },
        { npc: 'Sure. What size?', vi: 'Được. Cỡ nào?', ok: 'Medium, please.' },
        { npc: 'Oat milk or regular?', vi: 'Sữa yến mạch hay sữa thường?', ok: 'Regular\'s fine.' },
        { npc: 'Anything else for you?', vi: 'Bạn cần thêm gì không?', ok: 'No, that\'s it, thanks.' },
        { npc: 'That\'ll be four fifty.', vi: 'Của bạn bốn đô năm mươi.', ok: 'Here you go.' }
      ] },
      { title: 'Gọi đồ ăn', turns: [
        { npc: 'Hi there! You hungry?', vi: 'Chào! Đói không?', ok: 'Yeah, I\'m starving.' },
        { npc: 'We\'ve got sandwiches, soup and muffins today.', vi: 'Hôm nay có bánh kẹp, súp và bánh muffin.', ok: 'I\'ll have a sandwich, please.' },
        { npc: 'Chicken or turkey?', vi: 'Gà hay gà tây?', ok: 'Chicken, please.' },
        { npc: 'Want a drink with that?', vi: 'Lấy thêm đồ uống không?', ok: 'Just water, thanks.' },
        { npc: 'For here or to go?', vi: 'Ăn ở đây hay mang đi?', ok: 'For here.' }
      ] },
      { title: 'Trò chuyện với Leo', turns: [
        { npc: 'Hey, haven\'t seen you before. I\'m Leo.', vi: 'Ơ, chưa gặp bạn bao giờ. Mình là Leo.', ok: 'Hi Leo, I\'m {name}.' },
        { npc: 'Nice to meet you! Where are you from?', vi: 'Vui được gặp bạn! Bạn từ đâu tới?', ok: 'I\'m from Vietnam.' },
        { npc: 'No way! Are you a student here?', vi: 'Thật á! Bạn học ở đây hả?', ok: 'Yeah, I go to Brightford High.' },
        { npc: 'Cool. What time\'s your class?', vi: 'Hay đó. Mấy giờ bạn vào lớp?', ok: 'At eight thirty.' },
        { npc: 'Come by tomorrow. Next coffee\'s on me!', vi: 'Mai ghé nhé. Ly sau mình bao!', ok: 'Thanks! See you tomorrow!' }
      ] }
    ]
  },
  'en-market': {
    lang: 'en', title: 'Chợ nông sản', npc: 'rosa', scene: 'market_en', unlock: 'en-a1-2', unlockText: 'Qua phòng A1-2 (số, giờ) để mở chợ.',
    souvenir: { img: 'souvenir_apples.png', name: 'Túi táo của Mrs. Rosa' },
    talks: [
      { title: 'Mua táo', turns: [
        { npc: 'Morning, sweetie! Everything\'s fresh today.', vi: 'Chào cháu! Hôm nay đồ tươi hết đó.', ok: 'Morning! I\'d like some apples.' },
        { npc: 'How many do you need?', vi: 'Cháu lấy mấy quả?', ok: 'Five, please.' },
        { npc: 'Red or green?', vi: 'Đỏ hay xanh?', ok: 'Red ones, please.' },
        { npc: 'Here you go. Anything else?', vi: 'Đây nè. Còn gì nữa không?', ok: 'No, that\'s all. How much is it?' },
        { npc: 'That\'s three bucks.', vi: 'Ba đô.', ok: 'Here\'s three dollars.' }
      ] },
      { title: 'Hỏi giá', turns: [
        { npc: 'These oranges are super sweet!', vi: 'Cam này ngọt lắm đó!', ok: 'How much are the oranges?' },
        { npc: 'A dollar each, or three for two.', vi: 'Một đô một quả, hoặc ba quả hai đô.', ok: 'I\'ll take three, then.' },
        { npc: 'Do you need a bag?', vi: 'Cháu cần túi không?', ok: 'No, I\'m good. I\'ve got one.' },
        { npc: 'Alright, that\'s two dollars.', vi: 'Được rồi, hai đô nhé.', ok: 'Can I pay by card?' },
        { npc: 'Sure, just tap here. Have a good one!', vi: 'Được chứ, quẹt ở đây. Chúc một ngày vui!', ok: 'Thanks, you too!' }
      ] },
      { title: 'Mua hoa tặng mẹ', turns: [
        { npc: 'Flowers for someone special?', vi: 'Mua hoa tặng ai đặc biệt hả?', ok: 'Yeah, they\'re for my mom.' },
        { npc: 'Aw, that\'s sweet! Roses or sunflowers?', vi: 'Dễ thương ghê! Hoa hồng hay hướng dương?', ok: 'Sunflowers. She loves yellow.' },
        { npc: 'How many would you like?', vi: 'Cháu lấy mấy bông?', ok: 'Ten, please.' },
        { npc: 'Want me to wrap them up?', vi: 'Bà gói lại cho cháu nhé?', ok: 'Yes, please. That\'d be great.' },
        { npc: 'Your mom\'s gonna love them!', vi: 'Mẹ cháu sẽ thích lắm đó!', ok: 'I hope so! Thanks, Mrs. Rosa!' }
      ] }
    ]
  },
  'en-hospital': {
    lang: 'en', title: 'Bệnh viện Brightford', npc: 'anna', scene: 'hospital_en', unlock: 'en-a1-test', unlockText: 'Tốt nghiệp A1 để mở bệnh viện (tình huống khó hơn).',
    souvenir: { img: 'souvenir_medkit.png', name: 'Hộp cứu thương' },
    talks: [
      { title: 'Đau đầu', turns: [
        { npc: 'Hi, come on in. What brings you in today?', vi: 'Chào, vào đi. Hôm nay bạn bị sao?', ok: 'I\'ve got a really bad headache.' },
        { npc: 'How long have you had it?', vi: 'Bị bao lâu rồi?', ok: 'Since last night.' },
        { npc: 'Any fever?', vi: 'Có sốt không?', ok: 'No, I don\'t think so.' },
        { npc: 'Okay. Drink lots of water and get some rest.', vi: 'Được. Uống nhiều nước và nghỉ ngơi nhé.', ok: 'Got it.' },
        { npc: 'Take one of these after meals.', vi: 'Uống một viên sau bữa ăn.', ok: 'Thanks, doctor.' }
      ] },
      { title: 'Đau bụng', turns: [
        { npc: 'Morning. What\'s going on?', vi: 'Chào buổi sáng. Bạn sao vậy?', ok: 'My stomach really hurts.' },
        { npc: 'What did you eat yesterday?', vi: 'Hôm qua bạn ăn gì?', ok: 'Some street food, I think.' },
        { npc: 'Does it hurt here?', vi: 'Đau chỗ này không?', ok: 'Ow, yeah, right there.' },
        { npc: 'No spicy food for a couple of days, okay?', vi: 'Vài ngày đừng ăn cay nhé?', ok: 'Okay. Is tea okay?' },
        { npc: 'Warm tea is fine. Feel better soon!', vi: 'Trà ấm thì được. Mau khoẻ nhé!', ok: 'Thanks so much!' }
      ] },
      { title: 'Bị cảm', turns: [
        { npc: 'You look pretty tired. You okay?', vi: 'Trông bạn mệt quá. Ổn không?', ok: 'I think I\'m coming down with a cold.' },
        { npc: 'Is your throat sore?', vi: 'Có đau họng không?', ok: 'Yeah, it\'s really sore.' },
        { npc: 'Your temperature\'s a little high.', vi: 'Nhiệt độ của bạn hơi cao.', ok: 'Should I stay home tomorrow?' },
        { npc: 'Yes, take a day off and sleep a lot.', vi: 'Ừ, nghỉ một ngày và ngủ nhiều vào.', ok: 'Okay, I will.' },
        { npc: 'Come back if it gets worse.', vi: 'Tệ hơn thì quay lại nhé.', ok: 'Will do. Thanks, Dr. Anna!' }
      ] }
    ]
  }

};
