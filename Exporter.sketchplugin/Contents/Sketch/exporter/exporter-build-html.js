
function buildMainHTML(options) {
  
    const verPostfix = "?"+Constants.DOCUMENT_VERSION_PLACEHOLDER

  let s = "";
  s += '<!DOCTYPE html>\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n';
  s += '<meta name="generator" content="Generated using Exporter plugin for Sketch.app - https://github.com/MaxBazarov/exporter">\n';
  s += '<title>'+options.docName+'</title>\n';
  s += '<link rel="shortcut icon"  type="image/png?" href="resources/icon.png'+verPostfix+'">\n';
  // s += '<link rel="mask-icon" href="https://sketch.cloud/favicon.svg?v=4" color="rgb(252, 177, 0)">\n';
  s += '<link rel="stylesheet" type="text/css" href="resources/viewer.css'+verPostfix+'">\n';
  if(options.centerContent){
    s += '<link rel="stylesheet" type="text/css" href="resources/viewer-center.css'+verPostfix+'">\n';
  }else{
    s += '<link rel="stylesheet" type="text/css" href="resources/viewer-top.css'+verPostfix+'">\n';
  }
  s += '<script type="text/javascript" src="resources/jquery-3.3.1.min.js" charset="UTF-8"></script>\n';
//  s += '<script type="text/javascript" src="resources/jquery-migrate-1.4.1.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery.hotkeys.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery.ba-hashchange.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="viewer/viewer-page.js'+verPostfix+'" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="viewer/story.js'+verPostfix+'" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="viewer/gallery.js'+verPostfix+'" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="viewer/viewer.js'+verPostfix+'" charset="UTF-8"></script>\n';
  if(options.loadLayers){
    s += '<script type="text/javascript" src="viewer/LayersData.js'+verPostfix+'" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="viewer/SymbolViewer.js'+verPostfix+'" charset="UTF-8"></script>\n';
  }
  if(options.commentsURL!=''){
    s += '<link rel="stylesheet" type="text/css" href="'+options.commentsURL+'/EasyPageComments.css'+verPostfix+'"/>\n';
    s += '<script type="text/javascript" src="'+options.commentsURL+'/EasyPageComments.js'+verPostfix+'"></script>\n';
    s += '<script type="text/javascript" src="'+options.commentsURL+'/comments.js'+verPostfix+'" charset="UTF-8"></script>\n';
  }
  s += '<script type="text/javascript">\n';
  s += '  var viewer = createViewer(story, "images");\n';
  s += '  jQuery(window).resize(function(){viewer.zoomContent()});\n';
  s += '  var gallery = createGallery();\n';
  if(options.commentsURL!=''){
    s += '  var comments = createComments();\n';
  }
  s += '</script>\n';
  if(options.googleCode!=''){
    s+="<!-- Global site tag (gtag.js) - Google Analytics -->\n"
    s+="<script async src='https://www.googletagmanager.com/gtag/js?id="+options.googleCode+"'></script>\n"
    s+="<script>\n"
    s+=" window.dataLayer = window.dataLayer || [];\n"
    s+=" function gtag(){dataLayer.push(arguments);}\n"
    s+=" gtag('js', new Date());\n"
    s+="gtag('config', '"+options.googleCode+"');\n"
    s+="</script>\n"
  }
  s += '<!--HEAD_INJECT-->\n';
  s += '</head>\n';
  s += '<body class="screen" style="background:'+options.backColor+'">\n';
  s += '<div class="containerSVG"> <svg> \
    <symbol id="icMenu" viewBox="0 0 24 24"> \
        <path fill="#404B58" d="M4,14 C2.8954305,14 2,13.1045695 2,12 C2,10.8954305 2.8954305,10 4,10 C5.1045695,10 6,10.8954305 6,12 C6,13.1045695 5.1045695,14 4,14 Z M12,14 C10.8954305,14 10,13.1045695 10,12 C10,10.8954305 10.8954305,10 12,10 C13.1045695,10 14,10.8954305 14,12 C14,13.1045695 13.1045695,14 12,14 Z M20,14 C18.8954305,14 18,13.1045695 18,12 C18,10.8954305 18.8954305,10 20,10 C21.1045695,10 22,10.8954305 22,12 C22,13.1045695 21.1045695,14 20,14 Z"/> \
    </symbol> \
    <symbol id="icArrwLeft" viewBox="0 0 24 24"> \
        <path fill="#404B58" d="M14.7071068,16.2928932 C15.0976311,16.6834175 15.0976311,17.3165825 14.7071068,17.7071068 C14.3165825,18.0976311 13.6834175,18.0976311 13.2928932,17.7071068 L8.29289322,12.7071068 C7.90236893,12.3165825 7.90236893,11.6834175 8.29289322,11.2928932 L13.2928932,6.29289322 C13.6834175,5.90236893 14.3165825,5.90236893 14.7071068,6.29289322 C15.0976311,6.68341751 15.0976311,7.31658249 14.7071068,7.70710678 L10.4142136,12 L14.7071068,16.2928932 Z"/>\
    </symbol> \
    <symbol id="icArrwRight" viewBox="0 0 24 24"> \
        <path fill="#404B58" d="M15.7071068,16.2928932 C16.0976311,16.6834175 16.0976311,17.3165825 15.7071068,17.7071068 C15.3165825,18.0976311 14.6834175,18.0976311 14.2928932,17.7071068 L9.29289322,12.7071068 C8.90236893,12.3165825 8.90236893,11.6834175 9.29289322,11.2928932 L14.2928932,6.29289322 C14.6834175,5.90236893 15.3165825,5.90236893 15.7071068,6.29289322 C16.0976311,6.68341751 16.0976311,7.31658249 15.7071068,7.70710678 L11.4142136,12 L15.7071068,16.2928932 Z" transform="matrix(-1 0 0 1 25 0)"/>\
    </symbol> \
    <symbol id="icHeart" viewBox="0 0 24 24">\
        <path fill="none" stroke="#404B58" stroke-width="2" d="M12,18.8536369 C17.3943819,16.1015046 20,12.9784118 20,9.5 C20,7.01471863 17.9852814,5 15.5,5 C14.4391705,5 13.4374107,5.36699819 12.6367778,6.02820949 L12,6.55409926 L11.3632222,6.02820949 C10.5625893,5.36699819 9.56082953,5 8.5,5 C6.01471863,5 4,7.01471863 4,9.5 C4,12.9784118 6.60561807,16.1015046 12,18.8536369 Z"/>\
    </symbol>\
     <symbol id="icPointer" viewBox="0 0 24 24">\
      <g fill="none" fill-rule="evenodd">\
      <path stroke="#404B58" stroke-linecap="round" stroke-linejoin="round" d="M7.27,16.28 C6.99,15.92 6.64,15.19 6.03,14.28 C5.68,13.78 4.82,12.83 4.56,12.34 C4.37257139,12.0422306 4.31818519,11.6796559 4.41,11.34 C4.56695997,10.6942088 5.17956117,10.2658164 5.84,10.34 C6.3508012,10.4426108 6.82022287,10.692969 7.19,11.06 C7.44818056,11.3031732 7.68566746,11.5674191 7.9,11.85 C8.06,12.05 8.1,12.13 8.28,12.36 C8.46,12.59 8.58,12.82 8.49,12.48 C8.42,11.98 8.3,11.14 8.13,10.39 C8,9.82 7.97,9.73 7.85,9.3 C7.73,8.87 7.66,8.51 7.53,8.02 C7.41116675,7.5385718 7.31770464,7.05123369 7.25,6.56 C7.12395297,5.93170405 7.21565432,5.27921373 7.51,4.71 C7.85939302,4.38136952 8.37193038,4.29463243 8.81,4.49 C9.25059657,4.81533625 9.57910137,5.2696514 9.75,5.79 C10.0120652,6.43038854 10.186961,7.10306465 10.27,7.79 C10.43,8.79 10.74,10.25 10.75,10.55 C10.75,10.18 10.68,9.4 10.75,9.05 C10.819353,8.68512412 11.0729584,8.3823117 11.42,8.25 C11.7178092,8.15862519 12.0328455,8.13807935 12.34,8.19 C12.6500367,8.25481591 12.9246639,8.43314524 13.11,8.69 C13.341681,9.27339299 13.470259,9.89259761 13.49,10.52 C13.5167786,9.97058648 13.6108133,9.42652817 13.77,8.9 C13.9371041,8.66454921 14.1811322,8.49479052 14.46,8.42 C14.7905931,8.35955512 15.1294069,8.35955512 15.46,8.42 C15.7310945,8.51063084 15.968241,8.68151586 16.14,8.91 C16.3517705,9.44034596 16.4799623,10.0003417 16.52,10.57 C16.52,10.71 16.59,10.18 16.81,9.83 C16.924325,9.49059769 17.2110346,9.23796868 17.5621281,9.16727587 C17.9132216,9.09658306 18.2753596,9.21856637 18.5121281,9.48727587 C18.7488967,9.75598537 18.824325,10.1305977 18.71,10.47 C18.71,11.12 18.71,11.09 18.71,11.53 C18.71,11.97 18.71,12.36 18.71,12.73 C18.6735613,13.3151793 18.5933368,13.8968067 18.47,14.47 C18.2959749,14.9771188 18.0537528,15.4581987 17.75,15.9 C17.2644478,16.4399641 16.8632544,17.0501826 16.56,17.71 C16.4847582,18.0378036 16.4511598,18.3737882 16.46,18.71 C16.4589965,19.020633 16.499351,19.3300173 16.58,19.63 C16.1711391,19.6732223 15.7588609,19.6732223 15.35,19.63 C14.96,19.57 14.48,18.79 14.35,18.55 C14.2856779,18.4211326 14.1540282,18.3397056 14.01,18.3397056 C13.8659718,18.3397056 13.7343221,18.4211326 13.67,18.55 C13.45,18.93 12.96,19.62 12.62,19.66 C11.95,19.74 10.57,19.66 9.48,19.66 C9.48,19.66 9.66,18.66 9.25,18.3 C8.84,17.94 8.42,17.52 8.11,17.24 L7.27,16.28 Z"/>\
      <path fill="#404B58" fill-rule="nonzero" d="M15.75,16.8258906 C15.75,17.0325054 15.5821068,17.1999998 15.375,17.1999998 C15.1678932,17.1999998 15,17.0325054 15,16.8258906 L15,13.3741092 C15,13.1674944 15.1678932,13 15.375,13 C15.5821068,13 15.75,13.1674944 15.75,13.3741092 L15.75,16.8258906 Z M13.7699939,16.8246259 C13.7711876,17.0307477 13.6042648,17.1988055 13.3971615,17.1999935 C13.1900581,17.2011815 13.0212,17.0350499 13.0200064,16.8289281 L13.0000064,13.3753739 C12.9988127,13.1692522 13.1657354,13.0011944 13.3728388,13.0000063 C13.5799421,12.9988183 13.7488002,13.16495 13.7499939,13.3710717 L13.7699939,16.8246259 Z M11.0000065,13.3789914 C10.9987989,13.1708972 11.1657103,13.0012199 11.3728136,13.0000065 C11.5799168,12.9987932 11.7487862,13.1665032 11.7499938,13.3745973 L11.7699938,16.8210084 C11.7712014,17.0291026 11.6042899,17.1987799 11.3971867,17.1999933 C11.1900834,17.2012066 11.0212141,17.0334966 11.0200065,16.8254025 L11.0000065,13.3789914 Z"/>\
     </g>\
    </symbol>\
    <symbol id="icAnnotation" viewBox="0 0 24 24">\
        <path fill="#404B58" d="M5,16 L13,16 C13.5522847,16 14,16.4477153 14,17 C14,17.5522847 13.5522847,18 13,18 L5,18 C4.44771525,18 4,17.5522847 4,17 C4,16.4477153 4.44771525,16 5,16 Z M5,6 L19,6 C19.5522847,6 20,6.44771525 20,7 C20,7.55228475 19.5522847,8 19,8 L5,8 C4.44771525,8 4,7.55228475 4,7 C4,6.44771525 4.44771525,6 5,6 Z M5,11 L19,11 C19.5522847,11 20,11.4477153 20,12 C20,12.5522847 19.5522847,13 19,13 L5,13 C4.44771525,13 4,12.5522847 4,12 C4,11.4477153 4.44771525,11 5,11 Z"/>\
    </symbol>\
    <symbol id="icEmbed" viewBox="0 0 24 24">\
        <path fill="#404B58" d="M6.7080808,14.2938686 C7.09806642,14.6849308 7.09719364,15.3180952 6.70613141,15.7080808 C6.31506919,16.0980664 5.68190481,16.0971936 5.2919192,15.7061314 L2.2919192,12.6978494 C1.90193253,12.3067862 1.90280651,11.6736197 2.29387128,11.2836345 L5.29387128,8.29191651 C5.684935,7.90193238 6.31809937,7.90280757 6.70808349,8.29387128 C7.09806762,8.684935 7.09719243,9.31809937 6.70612872,9.70808349 L4.41421491,11.9936701 L6.7080808,14.2938686 Z M17.2938713,9.70808349 C16.9028076,9.31809937 16.9019324,8.684935 17.2919165,8.29387128 C17.6819006,7.90280757 18.315065,7.90193238 18.7061287,8.29191651 L21.7061287,11.2836345 C22.0971935,11.6736197 22.0980675,12.3067862 21.7080808,12.6978494 L18.7080808,15.7061314 C18.3180952,16.0971936 17.6849308,16.0980664 17.2938686,15.7080808 C16.9028064,15.3180952 16.9019336,14.6849308 17.2919192,14.2938686 L19.5857851,11.9936701 L17.2938713,9.70808349 Z M13.0513167,5.68377223 C13.2259645,5.15982892 13.7922844,4.87666893 14.3162278,5.0513167 C14.8401711,5.22596447 15.1233311,5.79228445 14.9486833,6.31622777 L10.9486833,18.3162278 C10.7740355,18.8401711 10.2077156,19.1233311 9.68377223,18.9486833 C9.15982892,18.7740355 8.87666893,18.2077156 9.0513167,17.6837722 L13.0513167,5.68377223 Z"/>\
    </symbol>\
    <symbol id="icGrid" viewBox="0 0 24 24"> \
        <g fill="none" fill-rule="evenodd"> \
            <circle cx="12" cy="12" r="2" fill="#404B58" fill-rule="nonzero"/><circle cx="12" cy="19" r="2" fill="#404B58" fill-rule="nonzero"/> <circle cx="12" cy="5" r="2" fill="#404B58" fill-rule="nonzero"/> <circle cx="19" cy="12" r="2" fill="#404B58" fill-rule="nonzero"/> <circle cx="18.5" cy="18.5" r="1.5" fill="#404B58" fill-rule="nonzero"/> <circle cx="18.5" cy="5.5" r="1.5" fill="#404B58" fill-rule="nonzero"/> <circle cx="5" cy="12" r="2" fill="#404B58" fill-rule="nonzero"/> <circle cx="5.5" cy="18.5" r="1.5" fill="#404B58" fill-rule="nonzero"/> <circle cx="5.5" cy="5.5" r="1.5" fill="#404B58" fill-rule="nonzero"/>\
        </g>\
     </symbol>\
     <symbol id="icEye" viewBox="0 0 24 24">\
        <g fill="none" fill-rule="evenodd">\
        <path stroke="#404B58" stroke-width="2" d="M12,18 C8.84433369,18 6.02417408,16.1748342 3.56423238,12.6431031 C3.08575701,11.9561574 3.08575613,11.0438938 3.56422633,10.3569527 C6.02414686,6.82518677 8.84431571,5 12,5 C15.1556663,5 17.9758259,6.82516576 20.4357676,10.3568969 C20.914243,11.0438426 20.9142439,11.9561062 20.4357737,12.6430473 C17.9758531,16.1748132 15.1556843,18 12,18 Z"/>\
        <circle cx="12" cy="11.5" r="2.5" fill="#404B58" fill-rule="nonzero"/> </g> </symbol> <symbol id="icClose" viewBox="0 0 24 24"> <path fill="#404B58" d="M10.5857864,12 L7.29289322,8.70710678 C6.90236893,8.31658249 6.90236893,7.68341751 7.29289322,7.29289322 C7.68341751,6.90236893 8.31658249,6.90236893 8.70710678,7.29289322 L12,10.5857864 L15.2928932,7.29289322 C15.6834175,6.90236893 16.3165825,6.90236893 16.7071068,7.29289322 C17.0976311,7.68341751 17.0976311,8.31658249 16.7071068,8.70710678 L13.4142136,12 L16.7071068,15.2928932 C17.0976311,15.6834175 17.0976311,16.3165825 16.7071068,16.7071068 C16.3165825,17.0976311 15.6834175,17.0976311 15.2928932,16.7071068 L12,13.4142136 L8.70710678,16.7071068 C8.31658249,17.0976311 7.68341751,17.0976311 7.29289322,16.7071068 C6.90236893,16.3165825 6.90236893,15.6834175 7.29289322,15.2928932 L10.5857864,12 Z" transform="rotate(-90 12 12)"/> \
    </symbol>\
    <symbol id="icBack" viewBox="0 0 24 24">\
        <path fill="#404B58" d="M8.36500685,12.7725895 C8.14212731,12.5891835 8,12.3112069 8,12.0000346 C8,11.7624738 8.08283717,11.5442607 8.22120202,11.3727048 L8.22132741,11.3368041 L12.2213274,6.37260414 C12.5678477,5.94255515 13.1973815,5.87484175 13.6274305,6.22136203 C14.0574795,6.56788232 14.1251929,7.1974161 13.7786726,7.6274651 L11.0611595,11.0000346 L19,11.0000346 C19.5522847,11.0000346 20,11.4477499 20,12.0000346 C20,12.5523194 19.5522847,13.0000346 19,13.0000346 L11.0998289,13.0000346 L13.7830365,16.3780588 C14.1265442,16.8105179 14.0544349,17.4395633 13.6219758,17.7830711 C13.1895167,18.1265788 12.5604713,18.0544695 12.2169635,17.6220104 L8.36500685,12.7725895 Z M5,6.00003462 C5.55228475,6.00003462 6,6.44774987 6,7.00003462 L6,17.0000346 C6,17.5523194 5.55228475,18.0000346 5,18.0000346 C4.44771525,18.0000346 4,17.5523194 4,17.0000346 L4,7.00003462 C4,6.44774987 4.44771525,6.00003462 5,6.00003462 Z"/> </symbol> <symbol id="icResize" viewBox="0 0 24 24"> <path fill="#404B58" d="M15.5857864,7 L13,7 C12.4477153,7 12,6.55228475 12,6 C12,5.44771525 12.4477153,5 13,5 L18,5 C18.5522847,5 19,5.44771525 19,6 L19,11 C19,11.5522847 18.5522847,12 18,12 C17.4477153,12 17,11.5522847 17,11 L17,8.41421356 L14.7071068,10.7071068 C14.3165825,11.0976311 13.6834175,11.0976311 13.2928932,10.7071068 C12.9023689,10.3165825 12.9023689,9.68341751 13.2928932,9.29289322 L15.5857864,7 Z M7,15.5857864 L9.29289322,13.2928932 C9.68341751,12.9023689 10.3165825,12.9023689 10.7071068,13.2928932 C11.0976311,13.6834175 11.0976311,14.3165825 10.7071068,14.7071068 L8.41421356,17 L11,17 C11.5522847,17 12,17.4477153 12,18 C12,18.5522847 11.5522847,19 11,19 L6,19 C5.44771525,19 5,18.5522847 5,18 L5,13 C5,12.4477153 5.44771525,12 6,12 C6.55228475,12 7,12.4477153 7,13 L7,15.5857864 Z"/>\
    </symbol>\
    <symbol id="icGridLayout" viewBox="0 0 24 24">\
      <path fill="#404B58" d="M6.07692308,5 C5.48215488,5 5,5.44771525 5,6 L5,17 C5,17.5522847 5.48215488,18 6.07692308,18 L17.9230769,18 C18.5178451,18 19,17.5522847 19,17 L19,6 C19,5.44771525 18.5178451,5 17.9230769,5 L6.07692308,5 Z M6.17647059,3 L17.8235294,3 C19.5778457,3 21,4.34314575 21,6 L21,17 C21,18.6568542 19.5778457,20 17.8235294,20 L6.17647059,20 C4.42215432,20 3,18.6568542 3,17 L3,6 C3,4.34314575 4.42215432,3 6.17647059,3 Z M14,5 L16,5 L16,18 L14,18 L14,5 Z M8,5 L10,5 L10,18 L8,18 L8,5 Z"/> \
    </symbol>\
    <symbol id="icInspector" viewBox="0 0 24 24">\
      <path fill="#404B58" d="M6,5 C5.40294373,5 5,5.41327562 5,6 L5,18 C5,18.5867244 5.40294373,19 6,19 L9,19 L9,5 L6,5 Z M6,3 L9,3 L9,21 L6,21 C4.22104159,21 3,19.7358628 3,18 L3,6 C3,4.26413718 4.22104159,3 6,3 Z M12,1 C12.5522847,1 13,1.44771525 13,2 L13,22 C13,22.5522847 12.5522847,23 12,23 C11.4477153,23 11,22.5522847 11,22 L11,2 C11,1.44771525 11.4477153,1 12,1 Z M15,3 L17,3 L17,5 L15,5 L15,3 Z M19,7 L21,7 L21,9 L19,9 L19,7 Z M19,11 L21,11 L21,13 L19,13 L19,11 Z M19,15 L21,15 L21,17 L19,17 L19,15 Z M15,19 L17,19 L17,21 L15,21 L15,19 Z M19,19 L21,19 C21,20.1045695 20.1045695,21 19,21 L19,19 Z M19,3 C20.1045695,3 21,3.8954305 21,5 L19,5 L19,3 Z"/>\
    </symbol>\
    </svg> </div>\n';
  s +=  '<!-- load indicator -->\n';
  s +=  '<div id="loading" >\n';
  s += '\
    <div class="shaft1"></div><div class="shaft2"></div><div class="shaft3"></div>\
    <div class="shaft4"></div><div class="shaft5"></div><div class="shaft6"></div><div class="shaft7"></div>\
  </div>    \
  <!--/load indicator-->\
     <div id="container">\
        <div id="marker"></div>\
        <div id="content" onclick="viewer.onContentClick()"></div>\
        <div id="sidebar" class="hidden">\
            <div id="symbol_viewer" class="hidden">\
                <p class="title">ELEMENT INSPECTOR</p>\
                <p>\
                    <select id="lib_selector"></select>\
                </p>\
                <div id="empty">\
                    Click any element to inspect\
                </div>\
                <div id="symbol_viewer_content">\
                </div>\
            </div>\
        </div>\
        <div id="content-shadow" class="hidden"  onclick="viewer.onContentClick()"></div>\
        <div id="content-modal" class="contentModal hidden" onclick="viewer.onModalClick()"></div>\
  ';
  if(options.commentsURL!=''){
    s += ' <div id="commenting" class="hidden">\n';
    s += '  <h1>EasyPageComments example page</h1>\n';
    s += '  <h2>Comments</h2>\n';
    s += '  <div id="Comments"></div>\n';
    s += '    <h2>Leave a comment</h2>\n';
    s += '  <div id="CommentForm"></div>\n';
    s += ' </div>\n';
    }    
s += '    <div id="gallery" class="hidden" onclick="gallery.hide(); return false;"></div>\n';
s += "    <div id=\"nav\" class=\""+(options.hideNav?"hidden":"nav")+"\">";
s += "            <div class=\"navLeft\">";
s += "                <div id=\"menu\" class=\"menu\">";
s += "                            <div class=\"groupe\">";
s += "                                <div class=\"item\" onclick=\"viewer.toggleLinks(); addRemoveClass('class','menu','active'); return false;\">";
s += "                                    <svg><use xlink:href=\"#icPointer\"><\/use><\/svg>";
s += "                                    <span>Hot Spots<\/span>";
s += "                                    <div class=\"tips\">⇧<\/div>";
s += "                                <\/div>";
s += "                                <div class=\"item\" onclick=\"viewer.toggleZoom(); addRemoveClass('class','menu','active'); return false;\">";
s += "                                    <svg><use xlink:href=\"#icResize\"><\/use><\/svg>";
s += "                                    <span>Toogle Auto-Scale<\/span>";
s += "                                    <div class=\"tips\">Z<\/div>";
s += "                                <\/div>";
s += "                                <div class=\"item\" onclick=\"addRemoveClass('class','menu','active'); viewer.share();  return false;\">";
s += "                                    <svg><use xlink:href=\"#icEmbed\"><\/use><\/svg>";
s += "                                    <span>Show Embed Code<\/span>";
s += "                                    <div class=\"tips\">E<\/div>";
s += "                                <\/div>";
s += "                                <div class=\"item\" onclick=\"addRemoveClass('class','menu','active'); viewer.toogleLayout();  return false;\">";
s += "                                    <svg><use xlink:href=\"#icGridLayout\"><\/use><\/svg>";
s += "                                    <span>Toogle Grid Layout<\/span>";
s += "                                    <div class=\"tips\">L<\/div>";
s += "                                <\/div>";
if(options.loadLayers){
s += "                                <div class=\"item\" onclick=\"addRemoveClass('class','menu','active'); viewer.symbolViewer.toggle();  return false;\">";
s += "                                    <svg><use xlink:href=\"#icInspector\"><\/use><\/svg>";
s += "                                    <span>Toogle Elements Inspector<\/span>";
s += "                                    <div class=\"tips\">M<\/div>";
s += "                                <\/div>";
}
/*
s += "                                <div class=\"item disabled\" onclick=\"addRemoveClass('class','annotation','active'); addRemoveClass('class','menu','active');\">";
s += "                                    <svg><use xlink:href=\"#icAnnotation\"><\/use><\/svg>";
s += "                                    <span>Annotation<\/span>";
s += "                                    <div class=\"tips\">⌘A<\/div>";
s += "                                <\/div>";
*/
if(options.commentsURL!=''){
  s += "                                <div class=\"item\" onclick=\"comments.switch(); return false;\">";
  s += "                                    <svg><use xlink:href=\"#icAnnotation\"><\/use><\/svg>";
  s += "                                    <span>Comments<\/span>";
  s += "                                <\/div>";
}
s += "                            <\/div>";
s += "                            <hr>";
s += "                            <div class=\"groupe\">";
s += "                                <div class=\"item\" onclick=\"gallery.show(); addRemoveClass('class','menu','active'); return false;\">";
s += "                                    <svg><use xlink:href=\"#icGrid\"><\/use><\/svg>";
s += "                                    <span>View All Screens<\/span>";
s += "                                    <div class=\"tips\">G<\/div>";
s += "                                <\/div>";
s += "                                <div class=\"item\" onclick=\"viewer.goToPage(0); addRemoveClass('class','menu','active'); return false;\">";
s += "                                    <svg><use xlink:href=\"#icBack\"><\/use><\/svg>";
s += "                                    <span>Go To Start<\/span>";
s += "                                    <div class=\"tips\">S<\/div>";
s += "                                <\/div>";
s += "                            <\/div>";
/*
s += "                            <hr>";
s += "                            <div class=\"groupe\">";
s += "                                <div class=\"item\" onclick=\"addRemoveClass('class','menu','active');\">";
s += "                                    <svg><use xlink:href=\"#icHeart\"><\/use><\/svg>";
s += "                                    <span>About<\/span>";
s += "                                <\/div>";
s += "                            <\/div>";
*/
s += "                <\/div>";
s += "                <div id=\"btnMenu\" class=\"btnMenu\" onclick=\"addRemoveClass('class', 'menu', 'active')\">";
s += "                    <svg><use xlink:href=\"#icMenu\"><\/use><\/svg>";
s += "                <\/div>";
s += "                <div id=\"btnOpenNew\" style='display:none' class=\"btnMenu\" onclick=\"viewer.openNewWindow();return false;\">";
s += "                    <svg><use xlink:href=\"#icResize\"><\/use><\/svg>";
s += "                <\/div>";
s += "                <div class=\"navPreviewNext\">";
s += "                    <div id=\"nav-left-prev\" class=\"btnPreview\" onclick=\"viewer.previous(); return false;\" title=\"Previous screen\">";
s += "                        <svg><use xlink:href=\"#icArrwLeft\"><\/use><\/svg>";
s += "                    <\/div>";
s += "                    <div id=\"nav-left-next\" class=\"btnNext\" onclick=\"viewer.next(); return false;\" title=\"Next screen\"><svg><use xlink:href=\"#icArrwRight\"><\/use><\/svg><\/div>";
s += "                <\/div>";
s += "            <\/div>";
s += "            <div class=\"navCenter\"><div class=\"pageName title\">Default button<\/div><\/div>";
s += "            <div class=\"navRight\">";
s += "            <\/div>";
s += "        <\/div>";

  s += ' </div>\n';
  s += '</body>\n';
  s += '</html>\n';

  return s;
};

