window.addEventListener('DOMContentLoaded', function() {
  listBif("example.bif", document.getElementById("bif-frames"));
  cycleBg("example2.bif", document.getElementById("bif-cycle"));
});

function listBif(url, target) {
  var bif = new BIFReader(url);
  console.log(["listbif count",bif.count]);
  console.log(bif.biffile);
  bif.load(function(bif_reader, idx) {
    target.insertAdjacentHTML("afterbegin", "<div>BIF has "+bif.count+" frames with " + (bif.multiplier/1000) + "s per frame</div>");
    console.log(["listbif count",bif.count]);
    console.log("bif loaded");
    for(var frame = 0; frame < bif.count; frame++) {
      let img = document.createElement("img");
      img.src = bif.idx[frame][1];
      target.appendChild(img);
    }

  }, function(progress) { console.log(progress); });

}

function cycleBg(url,target) {
  var bif = new BIFReader(url);
  console.log(["cycleBg count",bif.count]);
  var bifinterval = -1;
  var frame = 0;
  console.log(["ele",target]);

  function nextFrame() {
    frame++;
    if(frame >= bif.count) frame = 0;
    target.style.backgroundImage = 'url('+bif.idx[frame][1]+')';
  }

  bif.load(function(bif_reader, idx) {
    console.log("bif loaded");
    console.log(["cycleBg count",bif.count]);
    nextFrame();
    setInterval(nextFrame, 1000);
  }, function(progress) { console.log(progress); });
}
