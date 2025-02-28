class VrController {
    // [GET] /vr
    index(req, res) {
        res.render('vr', {}); 
    }

    async vrtour(req, res, next) {
        try {
          const slug = req.params.slug || '';
          res.render('vr', { 
            slug,
            layout: false // Để tránh sử dụng layout mặc định nếu có
          });
        } catch (error) {
          next(error);
        }
      }
}

module.exports = new VrController();