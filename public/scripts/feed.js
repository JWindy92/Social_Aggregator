let Parser = require('rss-parser');
let parser = new Parser();
// let http = require('http');

// function validate_url(url) {
//     let options = {
//         method: 'HEAD',
//         host : url,
//         port : 80,
//         path : url
//     };
//     let retVal = false;
//     var req = http.request(options, function(r) {
//         retVal = (r.statusCode == 200);
//     })
//     req.end();
//     return retVal;
// }

async function get_feed(req, res, next) {
    let feed_arr = ['https://www.reddit.com/.rss', 'https://threatpost.com/feed']
    let feed = []
    for(var i = 0; i < feed_arr.length; i++){
        let rss = await parser.parseURL(feed_arr[i]);
        
        for(var j = 0; j < rss.items.length; j++) {
            item = rss['items'][j];
            item['isoDate'] = new Date(item['isoDate']);
            item['feed_title'] = rss.title;
            feed.push(item);
        }
    
    } 
    
    feed = quick_sort(feed).reverse();
    req.feed = feed;
    next();

};

//* Start quick sort
function swap(items, leftIndex, rightIndex) {
    var temp = items[leftIndex];
    items[leftIndex] = items[rightIndex];
    items[rightIndex] = temp;
}
  
function partition(items, left, right) {
    let pivot = items[Math.floor((right + left) / 2)], //middle element
      i = left,
      j = right;
  
    while (i <= j) {
      while (items[i]['isoDate'] < pivot['isoDate']) { //* while left item is less than pivot element
        i++; //* increment left index
      }
  
      while (items[j]['isoDate'] > pivot['isoDate']) { //* while right item is more than pivot element
        j--; //* increment right index
      }
  
      if (i <= j) { //* swap both elements if left 
        swap(items, i, j); //* swap both elements
        i++;
        j--;
      }
    }
  
    return i; //* returns left index
}
  
function quick_sort(items, left, right) {
    var index;
  
    if (items.length > 1) {
      index = partition(items, left, right); //* left index returned from partition
  
      if (left < index - 1) { //* more elements on left side of pivot
        quick_sort(items, left, index -1);
      }
  
      if (index < right) { //* more elements on the right side of pivot
        quick_sort(items, index, right);
      }
    }
  
    return items;
}
  
//* End quick sort

module.exports = {
    'get_feed' : get_feed,
    'quick_sort' : quick_sort
}

