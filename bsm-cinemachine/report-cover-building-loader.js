(function(root){
  var parts=root.__BSM_BUILDING_PARTS||[];
  if(parts[0]&&parts[1]){
    root.BSM_BUILDING_COVER_DATA='data:image/webp;base64,'+parts[0]+parts[1];
  }
})(typeof window!=='undefined'?window:this);
