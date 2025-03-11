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
          
          // Lấy các bài đăng (phân tích từ HTML mới)
          const articles = document.querySelectorAll('.post, .experience_item');
          
          if (articles.length === 0) {
            console.log(`⚠️ Không tìm thấy bài viết trên trang ${page}, có thể đã hết dữ liệu.`);
            return [];
          }
          
          // Xử lý tối đa 10 bài viết mỗi trang để giảm thời gian
          const maxArticlesPerPage = 10;
          const limitedArticles = Array.from(articles).slice(0, maxArticlesPerPage);
          
          return limitedArticles.map((article) => {
            try {
              // Quét toàn bộ cấu trúc HTML để tìm các thành phần cần thiết
              console.log(`Đang xử lý bài viết...`);
              
              // Lấy tiêu đề từ thẻ h3 > a
              let title = 'Không có tiêu đề';
              let linkUrl = '#';
              
              // Tìm thẻ h3 trong post_box
              const titleElement = article.querySelector('h3.cl-text.title.fw-6.title-m');
              if (titleElement) {
                // Lấy tiêu đề từ nội dung văn bản của h3
                title = titleElement.textContent.trim();
                
                // Tìm thẻ a trong h3 để lấy URL
                const linkElement = titleElement.querySelector('a');
                if (linkElement) {
                  linkUrl = linkElement.getAttribute('href');
                }
              } else {
                // Thử tìm thẻ a với class post_img
                const imgLinkElement = article.querySelector('a.post_img');
                if (imgLinkElement) {
                  linkUrl = imgLinkElement.getAttribute('href');
                  // Nếu không tìm thấy tiêu đề từ h3, thử lấy từ alt của hình ảnh
                  const imgElement = imgLinkElement.querySelector('img');
                  if (imgElement && imgElement.getAttribute('alt')) {
                    title = imgElement.getAttribute('alt');
                  }
                }
              }
              
              // Lấy URL hình ảnh
              let imageUrl = null;
              const imgTag = article.querySelector('img');
              if (imgTag) {
                imageUrl = imgTag.getAttribute('src');
              }
              
              // Lấy ngày đăng
              let publishDate = 'Không có ngày';
              const dateTag = article.querySelector('.note-text.cl-text3');
              if (dateTag) {
                publishDate = dateTag.textContent.trim();
              }
              
              // Lấy nội dung tóm tắt
              let content = 'Không có nội dung';
              const contentTag = article.querySelector('.note-text.cl-gray3.content');
              if (contentTag) {
                content = contentTag.textContent.trim();
              }
              
              // Lấy tác giả/nguồn
              let author = 'Quang Binh Travel';
              const authorTag = article.querySelector('.note-text.cl-text.fw-6');
              if (authorTag) {
                author = authorTag.textContent.trim();
              }
              
              // Debug log
              console.log(`Tiêu đề: "${title}"`);
              console.log(`Link: ${linkUrl}`);
              console.log(`Ảnh: ${imageUrl}`);
              
              return {
                imageUrl,
                title,
                link: linkUrl,
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
      
      // Kiểm tra và log xem có bài viết nào không có tiêu đề không
      const postsWithNoTitle = allPosts.filter(post => post.title === 'Không có tiêu đề');
      if (postsWithNoTitle.length > 0) {
        console.log(`⚠️ Có ${postsWithNoTitle.length} bài viết không lấy được tiêu đề`);
      }
      
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
      
      // Kiểm tra xem URL đã có đầy đủ domain chưa
      const fullUrl = url.startsWith('http') ? url : `https://quangbinhtravel.vn/${url}`;
      
      console.log(`Đang tải chi tiết bài viết: ${fullUrl}`);
      
      const response = await axios.get(fullUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Lấy chi tiết bài viết
      let title = 'Chi tiết bài viết';
      const titleElement = document.querySelector('h3.cl-text.title.fw-6.title-m');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      let content = 'Không có nội dung';
      const contentElement = document.querySelector('.note-text.cl-gray3.content, .post_content');
      if (contentElement) {
        content = contentElement.innerHTML;
      }
      
      let date = '';
      const dateElement = document.querySelector('.note-text.cl-text3');
      if (dateElement) {
        date = dateElement.textContent.trim();
      }
      
      let author = 'Quang Binh Travel';
      const authorElement = document.querySelector('.note-text.cl-text.fw-6');
      if (authorElement) {
        author = authorElement.textContent.trim();
      }
      
      // Lấy các hình ảnh trong bài viết
      const images = Array.from(document.querySelectorAll('.post_content img, .post_lf--wrap img')).map(img => img.src);
      
      console.log(`Đã tải chi tiết bài viết: ${title}`);
      
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
