const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

http.createServer((req, res) => {
  // Loại bỏ các tham số query trong URL
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  const filePath = path.join(__dirname, urlPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Nếu không tìm thấy file, tự động trả về trang chủ index.html
        fs.readFile(path.join(__dirname, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Lỗi hệ thống: Không tìm thấy tệp index.html trong thư mục ứng dụng.');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Lỗi hệ thống: ${err.code}`);
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/plain';
      if (ext === '.html') contentType = 'text/html';
      else if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.json') contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  PHẦN MỀM QUẢN LÝ HỤI CHỦ THẢO ĐANG CHẠY (LOCAL SERVER ACTIVE)`);
  console.log(`  Địa chỉ truy cập trên trình duyệt: http://localhost:${PORT}`);
  console.log(`================================================================`);
  console.log(`  Vui lòng KHÔNG TẮT cửa sổ dòng lệnh đen này khi đang sử dụng.`);
  console.log(`  Khi dùng xong, hãy tắt cửa sổ này hoặc nhấn Ctrl+C để đóng.`);
  console.log(`================================================================`);
});
