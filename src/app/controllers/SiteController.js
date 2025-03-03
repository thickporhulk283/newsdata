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

          const experienceContainer = document.querySelector('.experience_bottom') ||
                                      document.querySelector('.experience_list');

          if (!experienceContainer) {
            console.log(`Không tìm thấy container trên trang ${page}, có thể đã hết trang.`);
            return [];
          }

          const postItems = experienceContainer.querySelectorAll('.experience_item');
          if (postItems.length === 0) {
            console.log(`Không tìm thấy bài viết trên trang ${page}, có thể đã hết trang.`);
            return [];
          }

          return Array.from(postItems).map((postItem) => {
            try {
              const postLf = postItem.querySelector('.post_lf-wrap') || postItem.querySelector('.post_lf');
              const postRt = postItem.querySelector('.post_rt');

              const imgElement = postLf?.querySelector('img');
              const imgUrl = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src') || null;

              const titleElement = postRt?.querySelector('h3') || postItem.querySelector('h3');
              const linkElement = titleElement?.querySelector('a') || postLf?.querySelector('a');

              const title = titleElement?.textContent.trim() || 'Không có tiêu đề';
              const link = linkElement?.getAttribute('href') || '#';

              const timeElement = postRt?.querySelector('.note-text.cl-text3') || postItem.querySelector('.note-text.cl-text3');
              const time = timeElement?.textContent.trim() || 'Không có ngày';

              const contentElement = postRt?.querySelector('.content') || postItem.querySelector('.content');
              const content = contentElement?.textContent.trim() || 'Không có nội dung';

              return {
                imageUrl: imgUrl,
                title,
                link,
                time,
                content,
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
          content: 'Công ty TNHH Netin (Netin Travel, trụ sở ở TP. Đồng Hới), là đơn vị lữ hành quốc tế có hơn 10 năm kinh nghiệm hoạt động du lịch.',
        }
      ];
      res.render('home', { posts: fallbackPosts });
    }
  }
}

module.exports = new SiteController();
