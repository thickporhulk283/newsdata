const axios = require('axios');
const { JSDOM } = require('jsdom');

class SiteController {
  async index(req, res, next) {
    try {
      console.log('🔄 Bắt đầu lấy dữ liệu...');
      
      // Thiết lập timeout cho axios
      const axiosConfig = {
        timeout: 10000 // 10 giây timeout
      };
      
      // Giảm số lượng trang để tải nhanh hơn
      const maxPages = 1;
      const promises = Array.from({ length: maxPages }, async (_, i) => {
        const page = i + 1;
        console.log(`📥 Đang lấy dữ liệu trang ${page}...`);
        try {
          const url = `https://quangbinhtourism.vn/noi-bat/tin-tuc/page/${page}`;
          const response = await axios.get(url, axiosConfig);
          const html = response.data;
          const dom = new JSDOM(html);
          const document = dom.window.document;
          const articles = document.querySelectorAll('.content-block.post-list-view');
          
          if (articles.length === 0) {
            console.log(`⚠️ Không tìm thấy bài viết trên trang ${page}, có thể đã hết dữ liệu.`);
            return [];
          }
          
          // Xử lý tối đa 10 bài viết mỗi trang để giảm thời gian
          const maxArticlesPerPage = 10;
          const limitedArticles = Array.from(articles).slice(0, maxArticlesPerPage);
          
          return limitedArticles.map((article) => {
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
          }).filter(Boolean);
        } catch (error) {
          console.error(`❌ Lỗi khi lấy dữ liệu trang ${page}:`, error.message);
          return [];
        }
      });
      
      // Thêm timeout tổng thể cho toàn bộ Promise.all
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000);
      });
// Kết hợp timeout với promises thực tế
      const allPosts = (await Promise.race([
        Promise.all(promises),
        timeoutPromise
      ])).flat();
      
      console.log(`✅ Lấy xong ${allPosts.length} bài viết!`);
      res.render('home', { posts: allPosts });
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu:', error.message);
      // Hiển thị trang dù có lỗi, có thể hiển thị thông báo lỗi
      res.render('home', { 
        posts: [],
        error: 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
      });
    }
  }

    async getNewsInfor(req, res) {
    try {
      const slug = req.params.slug;
      const url = `https://quangbinhtourism.vn/noi-bat/${slug}.html`;

      const { data } = await axios.get(url);
      const dom = new JSDOM(data);
      const document = dom.window.document;

      const title = document.querySelector('h1.title')?.textContent.trim() || 'Không có tiêu đề';
      const date = document.querySelector('.post-meta-date')?.textContent.trim() || 'Không có ngày';
      const readingTime = document.querySelector('.post-meta-reading-time')?.textContent.trim() || 'Không có thời gian đọc';
      const postDetails = document.querySelector('.axil-post-details');

      if (!postDetails) {
        return res.status(404).render('error', { message: 'Không tìm thấy nội dung bài viết' });
      }

      res.render('news', {
        title,
        date,
        readingTime,
        content: postDetails.innerHTML,
      });
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      res.status(500).render('error', { message: 'Lỗi máy chủ, vui lòng thử lại sau' });
    }
  }
}

module.exports = new SiteController();
