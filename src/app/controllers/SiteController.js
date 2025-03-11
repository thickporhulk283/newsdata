const axios = require('axios');
const { JSDOM } = require('jsdom');

class SiteController {
  async index(req, res, next) {
    try {
      console.log('🔄 Bắt đầu lấy dữ liệu từ Quang Binh Travel...');
      
      // Thiết lập timeout cho axios
      const axiosConfig = {
        timeout: 15000, // 15 giây timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };
      
      // Giảm số lượng trang để tải nhanh hơn
      const maxPages = 3;
      const promises = Array.from({ length: maxPages }, async (_, i) => {
        const page = i + 1;
        console.log(`📥 Đang lấy dữ liệu trang ${page}...`);
        try {
          const url = `https://quangbinhtravel.vn/tin-tuc/goc-bao-chi/page/${page}`;
          const response = await axios.get(url, axiosConfig);
          const html = response.data;
          const dom = new JSDOM(html);
          const document = dom.window.document;
          
          // Dựa vào HTML mẫu, các bài đăng có class="post"
          const articles = document.querySelectorAll('.post');
          
          if (articles.length === 0) {
            console.log(`⚠️ Không tìm thấy bài viết trên trang ${page}, có thể đã hết dữ liệu.`);
            return [];
          }
          
          // Xử lý tối đa 10 bài viết mỗi trang để giảm thời gian
          const maxArticlesPerPage = 10;
          const limitedArticles = Array.from(articles).slice(0, maxArticlesPerPage);
          
          return limitedArticles.map((article) => {
            try {
              // Các selector phù hợp với HTML mẫu
              const imgTag = article.querySelector('.post_lf--wrap img');
              const titleTag = article.querySelector('.cl-text.title.fw-6.title-m');
              const linkTag = article.querySelector('.post_lf--wrap a, .cl-text.title.fw-6.title-m a');
              const dateTag = article.querySelector('.note-text.cl-text3');
              const contentTag = article.querySelector('.note-text.cl-gray3.content');
              const authorTag = article.querySelector('.note-text.cl-text.fw-6');
              
              // Lấy URL hình ảnh từ thuộc tính src
              const imageUrl = imgTag ? imgTag.getAttribute('src') : null;
              
              // Lấy link từ thẻ a
              const link = linkTag ? linkTag.getAttribute('href') : '#';
              
              // Lấy tiêu đề
              const title = titleTag ? titleTag.textContent.trim() : 'Không có tiêu đề';
              
              // Lấy ngày đăng
              let publishDate = 'Không có ngày';
              if (dateTag) {
                const dateText = dateTag.textContent.trim();
                // Format lại ngày nếu cần
                publishDate = dateText;
              }
              
              // Lấy nội dung tóm tắt
              const content = contentTag ? contentTag.textContent.trim() : 'Không có nội dung';
              
              // Lấy tên tác giả/nguồn
              const author = authorTag ? authorTag.textContent.trim() : 'Quang Binh Travel';
              
              return {
                imageUrl,
                title,
                link,
                date: publishDate,
                content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                author,
                page
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
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
      });
      
      // Kết hợp timeout với promises thực tế
      const allPosts = (await Promise.race([
        Promise.all(promises),
        timeoutPromise
      ])).flat();
      
      console.log(`✅ Lấy xong ${allPosts.length} bài viết từ Quang Binh Travel!`);
      res.render('home', { 
        posts: allPosts,
        title: 'Tin tức Quang Bình Travel',
        error: null
      });
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu:', error.message);
      // Hiển thị trang dù có lỗi, có thể hiển thị thông báo lỗi
      res.render('home', { 
        posts: [],
        title: 'Tin tức Quang Bình Travel',
        error: 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
      });
    }
  }
  
  // Thêm phương thức để xem chi tiết bài viết nếu cần
  async viewDetail(req, res, next) {
    try {
      const url = req.params.url || '';
      if (!url) {
        return res.redirect('/');
      }
      
      const fullUrl = `https://quangbinhtravel.vn/${url}`;
      const response = await axios.get(fullUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Lấy chi tiết bài viết
      const title = document.querySelector('.cl-text.title.fw-6.title-m')?.textContent.trim() || 'Chi tiết bài viết';
      const content = document.querySelector('.note-text.cl-gray3.content')?.innerHTML || 'Không có nội dung';
      const date = document.querySelector('.note-text.cl-text3')?.textContent.trim() || '';
      const author = document.querySelector('.note-text.cl-text.fw-6')?.textContent.trim() || 'Quang Binh Travel';
      
      // Lấy các hình ảnh trong bài viết
      const images = Array.from(document.querySelectorAll('.post_content img')).map(img => img.src);
      
      res.render('detail', {
        title,
        content,
        date,
        author,
        images,
        url: fullUrl
      });
    } catch (error) {
      console.error('❌ Lỗi khi tải chi tiết bài viết:', error.message);
      res.render('detail', {
        title: 'Không thể tải bài viết',
        content: 'Đã xảy ra lỗi khi tải nội dung bài viết. Vui lòng thử lại sau.',
        date: '',
        author: '',
        images: [],
        url: req.params.url || ''
      });
    }
  }
}

module.exports = new SiteController();
