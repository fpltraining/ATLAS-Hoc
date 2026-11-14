/* Nội dung Học viện Hán ngữ cấp HSK1. Mỗi mục: zh (chữ Hán), py (pinyin), vi (nghĩa),
   câu ví dụ: w (chữ Hán, cách nhau theo từ để chơi trò sắp xếp), wpy (pinyin), exVi (nghĩa). */
var G = window.G || (window.G = {});
G.ROOMS = G.ROOMS || {};

(function () {
  function Z(zh, py, vi, w, wpy, exVi) { return { zh: zh, py: py, vi: vi, w: w, ex: w.replace(/ /g, ''), exPy: wpy, exVi: exVi }; }

  G.ROOMS['zh-py'] = {
    id: 'zh-py', lang: 'zh', title: 'Phát âm · Pinyin và 4 thanh', teacher: 'wang',
    intro: ['你好！我是王老师。', 'Mình là cô Vương. Tiếng Trung có 4 thanh: ā (ngang cao), á (đi lên), ǎ (xuống rồi lên), à (đi xuống). Nghe kỹ để phân biệt nhé.'],
    introPy: 'Nǐ hǎo! Wǒ shì Wáng lǎoshī.',
    items: [
      Z('妈', 'mā', 'mẹ · thanh 1', '妈妈 很 好。', 'Māma hěn hǎo.', 'Mẹ rất khoẻ.'),
      Z('麻', 'má', 'cây gai · thanh 2', '这 是 麻。', 'Zhè shì má.', 'Đây là cây gai.'),
      Z('马', 'mǎ', 'con ngựa · thanh 3', '我 喜欢 马。', 'Wǒ xǐhuan mǎ.', 'Mình thích ngựa.'),
      Z('骂', 'mà', 'mắng · thanh 4', '妈妈 不 骂 我。', 'Māma bú mà wǒ.', 'Mẹ không mắng mình.'),
      Z('八', 'bā', 'số tám', '我 有 八 本 书。', 'Wǒ yǒu bā běn shū.', 'Mình có tám quyển sách.'),
      Z('爸', 'bà', 'bố', '爸爸 喝 茶。', 'Bàba hē chá.', 'Bố uống trà.'),
      Z('一', 'yī', 'số một', '我 有 一 个 妹妹。', 'Wǒ yǒu yí ge mèimei.', 'Mình có một em gái.'),
      Z('书', 'shū', 'sách', '这 是 我 的 书。', 'Zhè shì wǒ de shū.', 'Đây là sách của mình.'),
      Z('水', 'shuǐ', 'nước', '我 要 喝 水。', 'Wǒ yào hē shuǐ.', 'Mình muốn uống nước.'),
      Z('是', 'shì', 'là', '我 是 学生。', 'Wǒ shì xuésheng.', 'Mình là học sinh.'),
      Z('四', 'sì', 'số bốn', '我 家 有 四 口 人。', 'Wǒ jiā yǒu sì kǒu rén.', 'Nhà mình có bốn người.'),
      Z('好', 'hǎo', 'tốt, khoẻ', '你 好 吗？', 'Nǐ hǎo ma?', 'Bạn khoẻ không?')
    ],
    outro: '很好！Thanh điệu chuẩn rồi đấy!'
  };

  G.ROOMS['zh-1-1'] = {
    id: 'zh-1-1', lang: 'zh', title: 'HSK1-1 · 你好 Chào hỏi', teacher: 'wang',
    intro: ['你好！欢迎来到长乐镇！', 'Hôm nay học chào hỏi, cảm ơn, xin lỗi và giới thiệu tên. Bấm 🔊 rồi đọc theo nhé.'],
    introPy: 'Nǐ hǎo! Huānyíng lái dào Chánglè zhèn!',
    items: [
      Z('你好', 'nǐ hǎo', 'xin chào', '你 好， 王 老师！', 'Nǐ hǎo, Wáng lǎoshī!', 'Chào cô Vương!'),
      Z('早上好', 'zǎoshang hǎo', 'chào buổi sáng', '老师， 早上 好！', 'Lǎoshī, zǎoshang hǎo!', 'Chào buổi sáng cô ạ!'),
      Z('晚上好', 'wǎnshang hǎo', 'chào buổi tối', '爸爸， 晚上 好！', 'Bàba, wǎnshang hǎo!', 'Chào buổi tối bố!'),
      Z('再见', 'zàijiàn', 'tạm biệt', '明天 见， 再见！', 'Míngtiān jiàn, zàijiàn!', 'Mai gặp nhé, tạm biệt!'),
      Z('谢谢', 'xièxie', 'cảm ơn', '谢谢 你， 老师。', 'Xièxie nǐ, lǎoshī.', 'Cảm ơn cô.'),
      Z('不客气', 'bú kèqi', 'không có gì', '不 客气， 再见！', 'Bú kèqi, zàijiàn!', 'Không có gì, tạm biệt!'),
      Z('对不起', 'duìbuqǐ', 'xin lỗi', '对不起， 我 来 晚 了。', 'Duìbuqǐ, wǒ lái wǎn le.', 'Xin lỗi, mình đến muộn.'),
      Z('没关系', 'méi guānxi', 'không sao', '没 关系， 请 进。', 'Méi guānxi, qǐng jìn.', 'Không sao, mời vào.'),
      Z('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Bạn tên là gì?', '你 好！ 你 叫 什么 名字？', 'Nǐ hǎo! Nǐ jiào shénme míngzi?', 'Chào bạn! Bạn tên là gì?'),
      Z('我叫Han。', 'Wǒ jiào Han.', 'Mình tên là Han.', '你 好， 我 叫 Han。', 'Nǐ hǎo, wǒ jiào Han.', 'Chào bạn, mình tên là Han.'),
      Z('很高兴认识你', 'hěn gāoxìng rènshi nǐ', 'rất vui được làm quen', '很 高兴 认识 你！', 'Hěn gāoxìng rènshi nǐ!', 'Rất vui được làm quen với bạn!'),
      Z('我是越南人。', 'Wǒ shì Yuènán rén.', 'Mình là người Việt Nam.', '我 是 越南人， 你 呢？', 'Wǒ shì Yuènán rén, nǐ ne?', 'Mình là người Việt Nam, còn bạn?')
    ],
    outro: '太棒了！Bạn đã biết chào hỏi bằng tiếng Trung.'
  };

  G.ROOMS['zh-1-2'] = {
    id: 'zh-1-2', lang: 'zh', title: 'HSK1-2 · 数字 Số, giờ, ngày', teacher: 'li',
    intro: ['你好！我是李老师。我们学数字吧。', 'Mình là thầy Lý. Hôm nay học số, hỏi giờ và ngày trong tuần.'],
    introPy: 'Nǐ hǎo! Wǒ shì Lǐ lǎoshī. Wǒmen xué shùzì ba.',
    items: [
      Z('一', 'yī', 'một', '我 有 一 个 哥哥。', 'Wǒ yǒu yí ge gēge.', 'Mình có một anh trai.'),
      Z('二', 'èr', 'hai', '二 加 三 是 五。', 'Èr jiā sān shì wǔ.', 'Hai cộng ba là năm.'),
      Z('三', 'sān', 'ba', '我 家 有 三 只 猫。', 'Wǒ jiā yǒu sān zhī māo.', 'Nhà mình có ba con mèo.'),
      Z('十', 'shí', 'mười', '我们 班 有 十 个 学生。', 'Wǒmen bān yǒu shí ge xuésheng.', 'Lớp mình có mười học sinh.'),
      Z('几', 'jǐ', 'mấy', '你 有 几 本 书？', 'Nǐ yǒu jǐ běn shū?', 'Bạn có mấy quyển sách?'),
      Z('现在几点？', 'Xiànzài jǐ diǎn?', 'Bây giờ mấy giờ?', '请问， 现在 几 点？', 'Qǐngwèn, xiànzài jǐ diǎn?', 'Xin hỏi, bây giờ mấy giờ?'),
      Z('八点', 'bā diǎn', 'tám giờ', '现在 八 点。', 'Xiànzài bā diǎn.', 'Bây giờ là tám giờ.'),
      Z('半', 'bàn', 'rưỡi (nửa)', '我 七 点 半 起床。', 'Wǒ qī diǎn bàn qǐchuáng.', 'Mình dậy lúc bảy giờ rưỡi.'),
      Z('今天', 'jīntiān', 'hôm nay', '今天 是 星期五。', 'Jīntiān shì xīngqīwǔ.', 'Hôm nay là thứ Sáu.'),
      Z('明天', 'míngtiān', 'ngày mai', '明天 见， 李 老师！', 'Míngtiān jiàn, Lǐ lǎoshī!', 'Mai gặp lại thầy Lý!'),
      Z('星期一', 'xīngqīyī', 'thứ Hai', '星期一 我 去 学校。', 'Xīngqīyī wǒ qù xuéxiào.', 'Thứ Hai mình đi học.'),
      Z('你几岁？', 'Nǐ jǐ suì?', 'Bạn mấy tuổi?', '小朋友， 你 几 岁？', 'Xiǎo péngyou, nǐ jǐ suì?', 'Bạn nhỏ ơi, cháu mấy tuổi?')
    ],
    outro: '很好！Bạn đã biết đếm và hỏi giờ.'
  };

  G.ROOMS['zh-1-3'] = {
    id: 'zh-1-3', lang: 'zh', title: 'HSK1-3 · 家人 Gia đình', teacher: 'zhang',
    intro: ['你好！我是张阿姨。你家有几口人？', 'Mình là dì Trương. Hôm nay học cách nói về gia đình và tả người.'],
    introPy: 'Nǐ hǎo! Wǒ shì Zhāng āyí. Nǐ jiā yǒu jǐ kǒu rén?',
    items: [
      Z('家', 'jiā', 'nhà, gia đình', '我 爱 我 的 家。', 'Wǒ ài wǒ de jiā.', 'Mình yêu gia đình mình.'),
      Z('妈妈', 'māma', 'mẹ', '我 妈妈 是 老师。', 'Wǒ māma shì lǎoshī.', 'Mẹ mình là giáo viên.'),
      Z('爸爸', 'bàba', 'bố', '我 爸爸 喜欢 喝 茶。', 'Wǒ bàba xǐhuan hē chá.', 'Bố mình thích uống trà.'),
      Z('哥哥', 'gēge', 'anh trai', '我 哥哥 二十 岁。', 'Wǒ gēge èrshí suì.', 'Anh trai mình hai mươi tuổi.'),
      Z('姐姐', 'jiějie', 'chị gái', '我 姐姐 很 漂亮。', 'Wǒ jiějie hěn piàoliang.', 'Chị gái mình rất xinh.'),
      Z('弟弟', 'dìdi', 'em trai', '我 弟弟 八 岁。', 'Wǒ dìdi bā suì.', 'Em trai mình tám tuổi.'),
      Z('妹妹', 'mèimei', 'em gái', '我 妹妹 喜欢 猫。', 'Wǒ mèimei xǐhuan māo.', 'Em gái mình thích mèo.'),
      Z('朋友', 'péngyou', 'bạn bè', '他 是 我 的 好 朋友。', 'Tā shì wǒ de hǎo péngyou.', 'Cậu ấy là bạn tốt của mình.'),
      Z('这是我妈妈。', 'Zhè shì wǒ māma.', 'Đây là mẹ mình.', '你 好！ 这 是 我 妈妈。', 'Nǐ hǎo! Zhè shì wǒ māma.', 'Xin chào! Đây là mẹ mình.'),
      Z('你家有几口人？', 'Nǐ jiā yǒu jǐ kǒu rén?', 'Nhà bạn có mấy người?', '请问， 你 家 有 几 口 人？', 'Qǐngwèn, nǐ jiā yǒu jǐ kǒu rén?', 'Xin hỏi, nhà bạn có mấy người?'),
      Z('他很高。', 'Tā hěn gāo.', 'Anh ấy rất cao.', '我 爸爸 很 高。', 'Wǒ bàba hěn gāo.', 'Bố mình rất cao.'),
      Z('她很漂亮。', 'Tā hěn piàoliang.', 'Cô ấy rất xinh.', '张 阿姨 很 漂亮。', 'Zhāng āyí hěn piàoliang.', 'Dì Trương rất xinh.')
    ],
    outro: '真棒！Bạn đã nói được về gia đình mình.'
  };

  G.ROOMS['zh-1-4'] = {
    id: 'zh-1-4', lang: 'zh', title: 'HSK1-4 · 吃饭 Ăn uống', teacher: 'chen',
    intro: ['你好！我是陈师傅。饿不饿？', 'Mình là bác Trần, đầu bếp. Hôm nay học tên đồ ăn, đồ uống và cách gọi món.'],
    introPy: 'Nǐ hǎo! Wǒ shì Chén shīfu. È bu è?',
    items: [
      Z('水', 'shuǐ', 'nước', '请 给 我 一 杯 水。', 'Qǐng gěi wǒ yì bēi shuǐ.', 'Cho mình xin một cốc nước.'),
      Z('茶', 'chá', 'trà', '中国人 喜欢 喝 茶。', 'Zhōngguó rén xǐhuan hē chá.', 'Người Trung Quốc thích uống trà.'),
      Z('咖啡', 'kāfēi', 'cà phê', '我 早上 喝 咖啡。', 'Wǒ zǎoshang hē kāfēi.', 'Buổi sáng mình uống cà phê.'),
      Z('米饭', 'mǐfàn', 'cơm', '我 想 吃 米饭。', 'Wǒ xiǎng chī mǐfàn.', 'Mình muốn ăn cơm.'),
      Z('面条', 'miàntiáo', 'mì sợi', '这 碗 面条 很 好吃。', 'Zhè wǎn miàntiáo hěn hǎochī.', 'Bát mì này rất ngon.'),
      Z('包子', 'bāozi', 'bánh bao', '我 要 两 个 包子。', 'Wǒ yào liǎng ge bāozi.', 'Cho mình hai cái bánh bao.'),
      Z('苹果', 'píngguǒ', 'quả táo', '这 个 苹果 很 甜。', 'Zhè ge píngguǒ hěn tián.', 'Quả táo này rất ngọt.'),
      Z('好吃', 'hǎochī', 'ngon', '陈 师傅 的 菜 很 好吃！', 'Chén shīfu de cài hěn hǎochī!', 'Món của bác Trần ngon lắm!'),
      Z('我饿了。', 'Wǒ è le.', 'Mình đói rồi.', '我 饿 了， 我们 吃饭 吧！', 'Wǒ è le, wǒmen chī fàn ba!', 'Mình đói rồi, mình đi ăn thôi!'),
      Z('我要一杯茶。', 'Wǒ yào yì bēi chá.', 'Cho mình một cốc trà.', '服务员， 我 要 一 杯 茶。', 'Fúwùyuán, wǒ yào yì bēi chá.', 'Phục vụ ơi, cho mình một cốc trà.'),
      Z('多少钱？', 'Duōshao qián?', 'Bao nhiêu tiền?', '这 个 包子 多少 钱？', 'Zhè ge bāozi duōshao qián?', 'Cái bánh bao này bao nhiêu tiền?'),
      Z('吃饭', 'chī fàn', 'ăn cơm', '我们 一起 吃饭 吧。', 'Wǒmen yìqǐ chī fàn ba.', 'Mình cùng đi ăn nhé.')
    ],
    outro: '好吃！Bạn đã gọi món được bằng tiếng Trung.'
  };

  G.ROOMS['zh-1-test'] = {
    id: 'zh-1-test', lang: 'zh', title: 'Thi cuối cấp HSK1', teacher: 'principal_li',
    final: { lang: 'zh', level: 'HSK1' }, testN: 20, passN: 16,
    intro: ['欢迎参加HSK1考试！我是李校长。', 'Đây là bài thi cuối cấp HSK1: 20 câu lấy từ 4 phòng HSK1. Đúng từ 16 câu là tốt nghiệp và nhận bằng HSK1.'],
    introPy: 'Huānyíng cānjiā HSK yī kǎoshì! Wǒ shì Lǐ xiàozhǎng.',
    items: [].concat(G.ROOMS['zh-1-1'].items, G.ROOMS['zh-1-2'].items, G.ROOMS['zh-1-3'].items, G.ROOMS['zh-1-4'].items),
    outro: '恭喜你！Chúc mừng bạn đã qua HSK1!'
  };
})();
