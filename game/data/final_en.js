/* Bài thi Tốt nghiệp ConnectLife: đầu ra giao tiếp (mở khi có Chứng chỉ Tầng 4 · B1 – B2).
   Phần 1 · Nghe: 3 hội thoại tốc độ thật, không hiện chữ, nghe tối đa 2 lần; 10 câu hỏi, đạt từ 7/10.
   Phần 2 · Tự xử lý: 5 tình huống đời thật, không có câu gợi ý; tự nói bằng câu của mình; trung bình từ 65/100.
   Phần 3 · Trò chuyện với người lạ: 8 lượt hỏi đáp, khoảng 5 phút; trung bình từ 60/100 và nói tổng cộng từ 200 từ.
   Đạt cả 3 phần mới là Tốt nghiệp ConnectLife. Giọng: m = nam (Michael), f = nữ (Heart). */
var G = window.G || (window.G = {});

G.FINAL_EN = {
  listen: [
    { title: 'Đổi kế hoạch cuối tuần', sit: 'Hai người bạn, Jake và Zoe, nói chuyện điện thoại về chuyến đi hồ cuối tuần.',
      lines: [
        ['f', 'Zoe', 'Hey Jake, are we still on for the lake this Saturday?'],
        ['m', 'Jake', 'About that. My car broke down yesterday, and the mechanic says it won\'t be ready until Monday.'],
        ['f', 'Zoe', 'Oh no. Well, we could take the bus instead. There\'s one that leaves the central station at eight.'],
        ['m', 'Jake', 'Eight? That\'s pretty early. Is there a later one?'],
        ['f', 'Zoe', 'There\'s one at ten, but then we\'d only get there around noon. I\'d rather go early and have the whole day.'],
        ['m', 'Jake', 'Fair enough. Let\'s meet at the station at half past seven, then.'],
        ['f', 'Zoe', 'Sounds good. I\'ll bring sandwiches if you can grab some drinks.'],
        ['m', 'Jake', 'Deal. And let\'s check the weather tonight, just in case.']
      ],
      qs: [
        { q: 'Why can\'t they drive to the lake?', vi: 'Vì sao họ không lái xe đi hồ được?', opts: ['Jake\'s car is being repaired.', 'The road to the lake is closed.', 'Zoe doesn\'t have a driver\'s license.', 'The lake is too far to drive.'], a: 0 },
        { q: 'What time will they meet at the station?', vi: 'Họ gặp nhau ở nhà ga lúc mấy giờ?', opts: ['At seven o\'clock.', 'At half past seven.', 'At eight o\'clock.', 'At ten o\'clock.'], a: 1 },
        { q: 'What will Jake bring?', vi: 'Jake sẽ mang theo gì?', opts: ['Sandwiches.', 'Some drinks.', 'An umbrella.', 'The bus tickets.'], a: 1 }
      ] },
    { title: 'Gọi về đơn hàng giao trễ', sit: 'Một khách hàng gọi tổng đài cửa hàng Brightford Home về món hàng đặt mua.',
      lines: [
        ['f', 'Ivy', 'Thanks for calling Brightford Home. This is Ivy speaking. How can I help?'],
        ['m', 'Customer', 'Hi, I ordered a desk lamp two weeks ago, and it still hasn\'t arrived. The order number is three, one, seven, eight.'],
        ['f', 'Ivy', 'Let me check. I\'m sorry, it looks like it was sent to your old address on Pine Street.'],
        ['m', 'Customer', 'Pine Street? I moved out of there in March. I updated my address on the website.'],
        ['f', 'Ivy', 'I\'m really sorry about that. I can send a new one to your current address. It should arrive on Thursday morning.'],
        ['m', 'Customer', 'Okay, Thursday works. But I paid for express shipping, and it took two weeks.'],
        ['f', 'Ivy', 'You\'re right. I\'ll refund the shipping fee, and I\'ll add a twenty percent discount code to your account.'],
        ['m', 'Customer', 'That\'s fair. Thanks for sorting it out.']
      ],
      qs: [
        { q: 'What went wrong with the order?', vi: 'Đơn hàng bị trục trặc gì?', opts: ['It was sent to his old address.', 'It arrived broken.', 'It was the wrong color.', 'He was charged twice.'], a: 0 },
        { q: 'When will the new lamp arrive?', vi: 'Khi nào cây đèn mới tới?', opts: ['On Monday morning.', 'On Thursday evening.', 'On Thursday morning.', 'In two weeks.'], a: 2 },
        { q: 'What will the company do for him?', vi: 'Công ty sẽ làm gì cho anh ấy?', opts: ['Give him a full refund only.', 'Refund the shipping fee and give a discount code.', 'Send him a free second lamp.', 'Nothing, because it was his mistake.'], a: 1 }
      ] },
    { title: 'Tranh luận chuyện lên văn phòng', sit: 'Hai đồng nghiệp, Linda và Grant, bàn về quy định mới của công ty.',
      lines: [
        ['f', 'Linda', 'So, the manager wants everyone back in the office five days a week, starting next month.'],
        ['m', 'Grant', 'Five days? Honestly, I think that\'s a step backwards. My commute is over an hour each way.'],
        ['f', 'Linda', 'I get that, but some of the new people are struggling. They need someone to ask when they get stuck.'],
        ['m', 'Grant', 'That\'s a fair point. Maybe the answer is somewhere in the middle.'],
        ['f', 'Linda', 'Like what? Three days in the office and two at home?'],
        ['m', 'Grant', 'Exactly. We could make Tuesday to Thursday office days, so the whole team is together.'],
        ['f', 'Linda', 'I like that. Why don\'t we suggest it to the manager as a one-month trial?'],
        ['m', 'Grant', 'Good idea. If it works, we\'ll have the numbers to prove it.']
      ],
      qs: [
        { q: 'What does the manager want?', vi: 'Quản lý muốn gì?', opts: ['Everyone working from home.', 'Everyone in the office five days a week.', 'Three office days a week.', 'A new, bigger office.'], a: 1 },
        { q: 'Why doesn\'t Grant like the plan?', vi: 'Vì sao Grant không thích kế hoạch này?', opts: ['He works at night.', 'The office is too noisy.', 'His commute is over an hour each way.', 'He has a second job.'], a: 2 },
        { q: 'Why does Linda think office time helps?', vi: 'Vì sao Linda nghĩ lên văn phòng có ích?', opts: ['New people need someone to ask for help.', 'The office has better internet.', 'It saves the company money.', 'The manager feels lonely.'], a: 0 },
        { q: 'What will they suggest to the manager?', vi: 'Họ sẽ đề xuất gì với quản lý?', opts: ['Quitting together.', 'A one-month trial of three office days.', 'Working from home every day.', 'Moving the office closer.'], a: 1 }
      ] }
  ],

  handle: [
    { id: 'cl-h1', npc: 'ivy', sit: 'Bạn để quên ví trên taxi sáng nay. Gọi hãng taxi: nói bạn mất gì, đi chuyến nào, lúc nào, và nhờ họ giúp.', q: 'City Taxi, good morning. How can I help you?', vi: 'Hãng taxi xin nghe. Tôi giúp gì được ạ?',
      need: [['lost', 'left', 'forgot'], ['wallet'], ['taxi', 'car', 'ride', 'driver'], ['this morning', 'yesterday', 'today', 'around', 'from', 'to the', 'airport', 'o\'clock'], ['could you', 'can you', 'please', 'help', 'call me', 'check', 'find']],
      sample: ['Hi, I think I left my wallet in one of your taxis this morning. I took a ride from the airport to Pine Street around nine. Could you please check and call me back?', 'Good morning. I lost my wallet in a taxi today, from the station to my office at about eight. It\'s brown leather. Can you help me find it, please?'] },
    { id: 'cl-h2', npc: 'ben', sit: 'Nửa đêm, nhà hàng xóm mở nhạc rất to. Bạn gõ cửa: xin lỗi đã làm phiền, nói vấn đề, lý do, và đề nghị một cách giải quyết.', q: 'Oh, hi! Is everything okay?', vi: 'Ồ, chào bạn! Có chuyện gì không?',
      need: [['sorry', 'excuse me', 'hate to'], ['music', 'noise', 'loud', 'party'], ['work', 'early', 'sleep', 'baby', 'tomorrow', 'exam'], ['could you', 'would you mind', 'please', 'turn it down', 'keep it down', 'quieter']],
      sample: ['Hi, sorry to bother you, but the music is really loud. I have to get up early for work tomorrow. Would you mind turning it down a little?', 'Excuse me, I hate to complain, but the party is very noisy and my baby can\'t sleep. Could you please keep it down after midnight?'] },
    { id: 'cl-h3', npc: 'anna', sit: 'Đi khám bác sĩ: kể triệu chứng, bị bao lâu rồi, rồi hỏi về thuốc (uống thế nào, có tác dụng phụ không).', q: 'Come in and have a seat. So, what brings you in today?', vi: 'Mời vào, ngồi đi. Hôm nay bạn đến khám vì sao?',
      need: [['headache', 'fever', 'cough', 'sore throat', 'pain', 'hurts', 'stomach', 'dizzy', 'tired'], ['for three days', 'since', 'days', 'a week', 'for a few'], ['medicine', 'pills', 'take', 'prescription', 'tablets'], ['side effects', 'sleepy', 'how often', 'allergic', 'safe']],
      sample: ['I\'ve had a bad headache and a fever for three days. Do I need any medicine? How often should I take it, and are there any side effects?', 'My throat hurts and I\'ve been coughing since Monday. Could you give me a prescription? Will the pills make me sleepy?'] },
    { id: 'cl-h4', npc: 'grant', sit: 'Sếp muốn bạn nộp báo cáo lớn vào sáng mai, nhưng bạn không kịp. Thương lượng: giải thích lý do và đề xuất hạn mới hoặc cách khác.', q: 'I need the full report on my desk by tomorrow morning.', vi: 'Tôi cần bản báo cáo đầy đủ trên bàn vào sáng mai.',
      need: [['sorry', 'afraid', 'understand'], ['can\'t', 'not possible', 'not enough time', 'too much', 'impossible', 'won\'t be able'], ['because', 'since', 'still waiting', 'data', 'another project', 'the reason'], ['friday', 'thursday', 'extra day', 'first part', 'afternoon', 'instead', 'could i', 'would it be possible', 'how about']],
      sample: ['I understand it\'s urgent, but I\'m afraid I can\'t finish the full report by tomorrow, because I\'m still waiting for the sales data. Would it be possible to send the first part tomorrow and the rest on Friday?', 'Sorry, that\'s not possible, since I\'m also on another project. How about tomorrow afternoon instead?'] },
    { id: 'cl-h5', npc: 'zoe', sit: 'Bạn thân định nghỉ việc để đi du lịch một năm và hỏi ý bạn. Cho lời khuyên có lý do, nói cả mặt tốt lẫn mặt rủi ro.', q: 'I\'m thinking of quitting my job to travel for a year. What do you think?', vi: 'Mình đang tính nghỉ việc đi du lịch một năm. Bạn nghĩ sao?',
      need: [['i think', 'if i were you', 'in my opinion', 'personally', 'honestly'], ['because', 'since', 'on the one hand', 'on the other hand', 'however'], ['money', 'savings', 'save', 'career', 'experience', 'job', 'risk'], ['should', 'could', 'why don\'t you', 'maybe', 'make sure', 'plan']],
      sample: ['Honestly, I think it\'s a great idea, because you\'ll get amazing experience. On the other hand, it\'s a big risk for your career. If I were you, I\'d make sure I had enough savings first.', 'In my opinion, you should go, but plan it well. Why don\'t you ask your boss for a long break instead of quitting? That way you keep your job.'] }
  ],

  talk: { npc: 'carlos', sit: 'Ở quán cà phê đông khách, một du khách xin ngồi chung bàn và bắt chuyện. Trò chuyện tự nhiên với anh ấy khoảng 5 phút: mỗi lượt nói vài câu, càng chi tiết càng tốt.',
    turns: [
      { id: 'cl-t1', q: 'Hi! Mind if I sit here? I\'m Carlos, visiting from Spain. Are you from around here? What do you do?', vi: 'Chào! Mình ngồi đây được không? Mình là Carlos, du khách Tây Ban Nha. Bạn là người ở đây à? Bạn làm nghề gì?',
        need: [['sure', 'of course', 'go ahead', 'please'], ['i am', 'my name', 'name'], ['from', 'live', 'grew up', 'born'], ['work', 'student', 'study', 'job', 'teacher', 'engineer', 'office', 'company', 'business']] },
      { id: 'cl-t2', q: 'Nice to meet you! What\'s your hometown like? Would you recommend it?', vi: 'Rất vui được gặp! Quê bạn thế nào? Bạn có khuyên mình đến không?',
        need: [['small', 'big', 'busy', 'quiet', 'beautiful', 'city', 'town', 'village', 'it is'], ['food', 'beach', 'people', 'weather', 'mountains', 'river', 'market', 'friendly'], ['recommend', 'should', 'worth', 'visit', 'must']] },
      { id: 'cl-t3', q: 'So what does a normal day look like for you?', vi: 'Vậy một ngày bình thường của bạn thế nào?',
        need: [['wake up', 'get up', 'morning'], ['work', 'school', 'study', 'office', 'class'], ['after', 'then', 'evening', 'usually', 'afternoon', 'at night']] },
      { id: 'cl-t4', q: 'I love traveling. Tell me about the best trip you\'ve ever taken.', vi: 'Mình mê du lịch. Kể mình nghe chuyến đi tuyệt nhất bạn từng đi đi.',
        need: [['went', 'visited', 'traveled', 'trip', 'was'], ['with', 'family', 'friends', 'alone'], ['best', 'amazing', 'beautiful', 'loved', 'never forget', 'favorite'], ['because', 'the view', 'the food', 'the people', 'we']] },
      { id: 'cl-t5', q: 'What do you do to relax when you\'re not working?', vi: 'Lúc không làm việc bạn thư giãn thế nào?',
        need: [['like', 'love', 'enjoy', 'usually', 'often'], ['play', 'watch', 'read', 'cook', 'music', 'sport', 'game', 'walk', 'gym', 'swim', 'run', 'listen'], ['because', 'helps', 'relax', 'fun', 'makes me']] },
      { id: 'cl-t6', q: 'Some people say phones are making us less social. Do you agree?', vi: 'Có người nói điện thoại làm mình ít giao tiếp hơn. Bạn có đồng ý không?',
        need: [['agree', 'disagree', 'i think', 'in my opinion', 'partly', 'to some extent'], ['because', 'since', 'the reason'], ['for example', 'for instance', 'like', 'such as'], ['on the other hand', 'however', 'but']] },
      { id: 'cl-t7', q: 'Where do you see yourself in five years?', vi: 'Năm năm nữa bạn thấy mình sẽ thế nào?',
        need: [['i hope', 'i want', 'i would like', 'plan', 'going to', 'will'], ['job', 'work', 'business', 'study', 'family', 'travel', 'english', 'live', 'move'], ['because', 'so that', 'that\'s why', 'the reason']] },
      { id: 'cl-t8', q: 'This was a great chat! Is there any place in this city I really shouldn\'t miss before I leave?', vi: 'Nói chuyện vui ghê! Trong thành phố có chỗ nào mình nhất định không nên bỏ lỡ trước khi về không?',
        need: [['should', 'must', 'recommend', 'have to', 'don\'t miss'], ['museum', 'market', 'park', 'beach', 'restaurant', 'café', 'cafe', 'street', 'temple', 'lake', 'old town', 'bridge', 'place'], ['because', 'it is', 'the view', 'the food', 'beautiful', 'famous'], ['enjoy', 'have fun', 'nice to meet', 'good luck', 'bye', 'take care', 'great to meet', 'safe trip']] }
    ] },

  intro: 'Welcome to the ConnectLife final exam. Today you show that you can really communicate in English. Good luck!',
  pass: { nghe: 7, xuly: 65, tro: 60, tu: 200 }
};
