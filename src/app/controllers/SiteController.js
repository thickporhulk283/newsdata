const axios = require('axios'); // Dùng axios để fetch dữ liệu từ API

class SiteController {
  async index(req, res, next) {
    try {
      const response = await axios.get('https://quangbinhtourism.vn/'); // URL API
      const html = response.data;
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const newsSection = document.querySelector('#post-latest-stories-3a8347e');
      const articles = newsSection ? newsSection.querySelectorAll('article') : [];

      const posts = Array.from(articles).map((article) => {
        const imgTag = article.querySelector('img');
        const titleTag = article.querySelector('a[title]');
        const dateTag = article.querySelector('.post-meta-date');
        const readingTimeTag = article.querySelector('.post-meta-reading-time');

        return {
          imageUrl: imgTag ? imgTag.src : null,
          title: titleTag ? titleTag.title : 'Không có tiêu đề',
          link: titleTag ? titleTag.href : '#',
          time: dateTag ? dateTag.textContent.trim() : 'Không có ngày',
          readingTime: readingTimeTag ? readingTimeTag.textContent.trim() : 'Không có thời gian đọc',
        };
      });

      res.render('home', { posts }); // Truyền dữ liệu vào view
    } catch (error) {
      next(error); // Xử lý lỗi
    }
  }
}

module.exports = new SiteController();
