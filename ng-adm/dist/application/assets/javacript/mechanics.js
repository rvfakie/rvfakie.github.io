// easePopup = function() {
//     $('.panel-popup-wrapper').css('display','block');
//     $('.panel-popup-wrapper .agree').on('click', function() {
//        return true;
//     });
// };

getRandomInt = function(min, max) {
    return Math.floor(min + (max - min) * Math.random());
};

getNow = function() {
    var today = new Date(),
        dd = today.getDate(),
        mm = today.getMonth()+1,
        yyyy = today.getFullYear(),
        date,
        time;

    if(dd<10) {
        dd='0'+dd
    }
    if(mm<10) {
        mm='0'+mm
    }

    date = mm+'/'+dd+'/'+yyyy;
    time = today.getHours()+':'+today.getMinutes()+':'+today.getSeconds();
    return date + '/' + time;
};

getRandomName = function (length) {
    var arr = ['a','b','c','d','e','f','g','h','i','j','k','j','m','n','o','p','q','r','s','t','u','v','w','x','y','z','1','2','3','4','5','6','7','8','9','0'];
    var result = '';
    for (var i = 0; i < length; i++) {
        result += arr[getRandomInt(0,36)];
    }
    return result;
};

showNextSibling = function(event, element) {
    if (!event.target.classList.contains('remove-item-row')) {
        $(element).toggleClass('active');
        $(element).next().toggleClass('shown');
    }
};

function removeDuplicates(originalArray, objKey) {
    var trimmedArray = [];
    var values = [];
    var value;
    for(var i = 0; i < originalArray.length; i++) {
        value = originalArray[i][objKey];

        if(values.indexOf(value) === -1) {
            trimmedArray.push(originalArray[i]);
            values.push(value);
        }
    }
    return trimmedArray;
}
