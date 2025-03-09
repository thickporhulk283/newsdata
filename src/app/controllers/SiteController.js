const axios = require('axios');
const { JSDOM } = require('jsdom');

class SiteController {
  async index(req, res, next) {
    try {
      console.log('🔄 Bắt đầu lấy dữ liệu...');

      // Tạo danh sách promises để lấy dữ liệu từ 5 trang
      const promises = Array.from({ length: 2 }, async (_, i) => {
        const page = i + 1;
        console.log(`📥 Đang lấy dữ liệu trang ${page}...`);

        try {
          const url = `https://quangbinhtourism.vn/noi-bat/tin-tuc/page/${page}`;
          const response = await axios.get(url);
          const html = response.data;
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const articles = document.querySelectorAll('.content-block.post-list-view');

          if (articles.length === 0) {
            console.log(`⚠️ Không tìm thấy bài viết trên trang ${page}, có thể đã hết dữ liệu.`);
            return [];
          }

          return Array.from(articles).map((article) => {
            try {
              const imgTag = article.querySelector('.post-thumbnail img');
              const titleTag = article.querySelector('.title a');
              const dateTag = article.querySelector('.post-meta-date');
              const readingTimeTag = article.querySelector('.post-meta-reading-time');
              const viewCountTag = article.querySelector('.view-count');

              return {
                imageUrl: imgTag ? imgTag.src : null,
                title: titleTag ? titleTag.textContent.trim() : 'Không có tiêu đề',
                link: titleTag ? titleTag.href : '#',
                time: dateTag ? dateTag.textContent.trim() : 'Không có ngày',
                readingTime: readingTimeTag ? readingTimeTag.textContent.trim() : 'Không có thời gian đọc',
                views: viewCountTag ? viewCountTag.textContent.trim() : '0 lượt xem',
                page,
              };
            } catch (err) {
              console.error(`❌ Lỗi xử lý bài viết trên trang ${page}:`, err);
              return null;
            }
          }).filter(Boolean); // Loại bỏ các bài viết null do lỗi xử lý
        } catch (error) {
          console.error(`❌ Lỗi khi lấy dữ liệu trang ${page}:`, error);
          return [];
        }
      });

      // Chạy tất cả requests song song
      const allPosts = (await Promise.all(promises)).flat();

      console.log(`✅ Lấy xong ${allPosts.length} bài viết!`);

      res.render('home', { posts: allPosts });

    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu:', error);
      res.render('home', { posts: [] });
    }
  }
}

module.exports = new SiteController();
