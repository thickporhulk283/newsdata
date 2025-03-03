const axios = require('axios');
const { JSDOM } = require('jsdom');

class SiteController {
  async index(req, res, next) {
    try {
      console.log('Bắt đầu lấy dữ liệu...');
      
      // Tạo danh sách các promises để chạy song song
      const promises = Array.from({ length: 3 }, async (_, i) => {
        const page = i + 1;
        console.log(`Fetching page ${page}...`);
        try {
          const url = `https://quangbinhtourism.vn/noi-bat/tin-tuc/${page}`;
          const response = await axios.get(url);
          const html = response.data;
          const dom = new JSDOM(html);
          const document = dom.window.document;
          
          // Sử dụng selector mới
          const newsSection = document.querySelector('#post-latest-stories-3a8347e');
          const articles = newsSection ? newsSection.querySelectorAll('article') : [];
          
          if (articles.length === 0) {
            console.log(`Không tìm thấy bài viết trên trang ${page}, có thể đã hết trang.`);
            return [];
          }
          
          return Array.from(articles).map((article) => {
            try {
              const imgTag = article.querySelector('img');
              const titleTag = article.querySelector('a[title]');
              const dateTag = article.querySelector('.post-meta-date');
              const readingTimeTag = article.querySelector('.post-meta-reading-time');
              
              return {
                imageUrl: imgTag ? imgTag.getAttribute('src') || imgTag.getAttribute('data-src') : null,
                title: titleTag ? titleTag.getAttribute('title') : 'Không có tiêu đề',
                link: titleTag ? titleTag.getAttribute('href') : '#',
                time: dateTag ? dateTag.textContent.trim() : 'Không có ngày',
                readingTime: readingTimeTag ? readingTimeTag.textContent.trim() : 'Không có thời gian đọc',
                page,
              };
            } catch (err) {
              console.error(`Lỗi khi xử lý bài viết trên trang ${page}:`, err);
              return null;
            }
          }).filter(Boolean); // Loại bỏ các giá trị null
        } catch (error) {
          console.error(`Lỗi khi lấy dữ liệu trang ${page}:`, error);
          return [];
        }
      });
      
      // Chạy tất cả các request song song
      const allPosts = (await Promise.all(promises)).flat();
      console.log(`Lấy xong ${allPosts.length} bài viết!`);
      res.render('home', { posts: allPosts });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      const fallbackPosts = [
        {
          imageUrl: 'https://www.quangbinhtravel.vn/wp-content/uploads/2024/09/750A6021-1024x683.jpg',
          title: 'Tiến phong làm du lịch có trách nhiệm',
          link: 'https://www.quangbinhtravel.vn/tien-phong-lam-du-lich-co-trach-nhiem.html',
          time: '14:04 - 16.09.2024',
          readingTime: '5 phút đọc',
        }
      ];
      res.render('home', { posts: fallbackPosts });
    }
  }
}

module.exports = new SiteController();
