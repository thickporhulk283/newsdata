const axios = require('axios');
const { JSDOM } = require('jsdom');

class SiteController {
  async index(req, res, next) {
    try {
      // Array to hold all posts from all pages
      let allPosts = [];
      
      // Loop through pages 1 to 10
      for (let page = 1; page <= 3; page++) {
        console.log(`Fetching page ${page}...`);
        
        // Fetch data from current page
        const url = `https://www.quangbinhtravel.vn/tin-tuc/goc-bao-chi/page/${page}`;
        const response = await axios.get(url);
        const html = response.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Find the container
        const experienceContainer = document.querySelector('.experience_bottom') ||
                                   document.querySelector('.experience_list');
        
        // If container not found, skip this page
        if (!experienceContainer) {
          console.log(`No container found on page ${page}, might be the last page.`);
          break; // Exit the loop if no container is found (likely reached end of pages)
        }
        
        // Get all post items
        const postItems = experienceContainer.querySelectorAll('.experience_item');
        
        // If no posts found, skip this page
        if (postItems.length === 0) {
          console.log(`No posts found on page ${page}, might be the last page.`);
          break;
        }
        
        // Process posts on current page
        const pagePosts = Array.from(postItems).map((postItem) => {
          try {
            // Find image and link parts
            const postLf = postItem.querySelector('.post_lf-wrap') || postItem.querySelector('.post_lf');
            const postRt = postItem.querySelector('.post_rt');
            
            // Get image URL
            const imgElement = postLf?.querySelector('img');
            const imgUrl = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src') || null;
            
            // Get title and link
            const titleElement = postRt?.querySelector('h3') || postItem.querySelector('h3');
            const linkElement = titleElement?.querySelector('a') || postLf?.querySelector('a');
            
            const title = titleElement?.textContent.trim() || 'Không có tiêu đề';
            const link = linkElement?.getAttribute('href') || '#';
            
            // Get time
            const timeElement = postRt?.querySelector('.note-text.cl-text3') ||
                              postItem.querySelector('.note-text.cl-text3');
            const time = timeElement?.textContent.trim() || 'Không có ngày';
            
            // Get content
            const contentElement = postRt?.querySelector('.content') ||
                                  postItem.querySelector('.content');
            const content = contentElement?.textContent.trim() || 'Không có nội dung';
            
            return {
              imageUrl: imgUrl,
              title: title,
              link: link,
              time: time,
              content: content,
              page: page // Add page number for reference
            };
          } catch (err) {
            console.error(`Lỗi khi xử lý bài viết trên trang ${page}:`, err);
            return {
              imageUrl: null,
              title: `Lỗi khi xử lý bài viết trên trang ${page}`,
              link: '#',
              time: '',
              content: '',
              page: page
            };
          }
        });
        
        // Add posts from current page to the allPosts array
        allPosts = [...allPosts, ...pagePosts];
        
        // Add a small delay to avoid overloading the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Render the view with all collected posts
      res.render('home', { posts: allPosts });
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      // Fallback data in case of error
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
