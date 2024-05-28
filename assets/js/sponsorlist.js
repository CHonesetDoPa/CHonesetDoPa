// sponsorlist.js
function populateSponsors() {
  var sponsorlist = [
      ['Nyaworks', '6 CNY'],
      ['Tymappo', '44 CNY'],
      ['IO2303', '5 USD'],
      ['CenterReduction', '6 CNY']
  ];

  // 获取表格的引用
  var table = document.getElementById('sponsor');

  // 遍历 sponsorlist 变量，并将内容写入表格
  for (var i = 0; i < sponsorlist.length; i++) {
      var sponsor = sponsorlist[i][0];
      var price = sponsorlist[i][1];

      // 创建新的行
      var row = table.insertRow(-1);

      // 创建单元格并添加内容
      var sponsorCell = row.insertCell(0);
      var priceCell = row.insertCell(1);
      sponsorCell.innerHTML = sponsor;
      priceCell.innerHTML = price;
  }
}

// 在页面加载完毕后调用 populateSponsors 函数
document.addEventListener('DOMContentLoaded', populateSponsors);
