// ================= BASIC SETUP =================
const canvas = document.getElementById("game");
canvas.width = 400;
canvas.height = 600;
const ctx = canvas.getContext("2d");

const scoreBoard = document.getElementById("scoreBoard");
const restartBtn = document.getElementById("restartBtn");
const musicBtn = document.getElementById("musicBtn");

let gameState = "loading";

let player, bullets=[], enemies=[], boss=null, bossBullets=[], powerUps=[];
let stars=[], explosions=[];
let score=0, highScore=0, lives=3;
let keys={};
let autoFireInterval;
let bulletLevel=1;

let shieldActive=false;
let shieldTimer=0;

let shakeTime=0, shakePower=0;

let level=1;
let maxLevel=10;
let bossScoreTarget=50;
let bossActive=false;

// ================= IMAGES =================
const shipImage=new Image();
shipImage.src="https://i.ibb.co/c9W74cK/Png-Item-1400038.png";

const bossImage=new Image();
bossImage.src="https://i.ibb.co/nqXnvW1G/vecteezy-a-sleek-ufo-hovers-silently-against-a-transparent-57448060.png";

// ================= SOUND =================
const shootSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
const explosionSound = new Audio("https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3");
const bgMusic = new Audio("https://assets.mixkit.co/music/preview/mixkit-arcade-space-shooter-coin-216.wav");

bgMusic.loop = true;
bgMusic.volume = 0.4;

let musicOn = true;

musicBtn.addEventListener("click", () => {
    musicOn = !musicOn;
    if (musicOn) {
        bgMusic.play();
        musicBtn.innerText = "Music: ON";
    } else {
        bgMusic.pause();
        musicBtn.innerText = "Music: OFF";
    }
});

// ================= INIT =================
function initGame(){
  player={x:185,y:500,width:60,height:80,speed:6};

  bullets=[]; enemies=[]; bossBullets=[]; powerUps=[];
  explosions=[]; boss=null;

  score=0; lives=3; bulletLevel=1;
  shieldActive=false; shieldTimer=0;

  level=1;
  bossScoreTarget=50;
  bossActive=false;

  highScore=localStorage.getItem("spaceHighScore")||0;

  restartBtn.style.display="none";
  createStars();
  startAutoFire();
  gameState="playing";

  if(musicOn) bgMusic.play();
}

setTimeout(()=>gameState="intro",2000);

// ================= CONTROLS =================
document.addEventListener("keydown",e=>keys[e.code]=true);
document.addEventListener("keyup",e=>keys[e.code]=false);

// ================= STARS =================
function createStars(){
  stars=[];
  for(let i=0;i<80;i++)
    stars.push({x:Math.random()*400,y:Math.random()*600});
}
function drawStars(){
  ctx.fillStyle="white";
  for(let s of stars){
    s.y+=1+level*0.4;
    if(s.y>600){s.y=0;s.x=Math.random()*400;}
    ctx.fillRect(s.x,s.y,2,2);
  }
}

// ================= SHOOT =================
function startAutoFire(){
  clearInterval(autoFireInterval);
  autoFireInterval=setInterval(()=>{
    if(gameState==="playing"){
      for(let i=0;i<bulletLevel;i++){
        let offset=(i-(bulletLevel-1)/2)*15;
        bullets.push({
          x:player.x+30-3+offset,
          y:player.y,
          width:6,height:15,speed:8
        });
      }
      shootSound.currentTime=0;
      shootSound.play();
    }
  },200);
}

// ================= COLLISION =================
function collision(a,b){
  return a && b &&
         a.x<b.x+b.width &&
         a.x+a.width>b.x &&
         a.y<b.y+b.height &&
         a.y+a.height>b.y;
}

// ================= POWERUPS =================
function dropPowerUp(x,y){
  let r=Math.random();
  let type=null;
  if(r<0.15) type="shield";
  else if(r<0.25) type="bullet";
  else if(r<0.30) type="life";
  if(type) powerUps.push({x,y,width:25,height:25,type});
}

// ================= BOSS =================
function spawnBoss(){
  bossActive=true;
  boss={
    x:110,y:60,width:180,height:100,
    maxHealth:200+level*40,
    health:200+level*40,
    dir:1
  };
}

// ================= UPDATE =================
function update(){

  let shakeX=0,shakeY=0;
  if(shakeTime>0){
    shakeX=(Math.random()-0.5)*shakePower;
    shakeY=(Math.random()-0.5)*shakePower;
    shakeTime--;
  }

  ctx.save();
  ctx.clearRect(0,0,400,600);
  ctx.translate(shakeX,shakeY);

  if(gameState==="loading"){
    ctx.fillStyle="white";
    ctx.font="28px Arial";
    ctx.fillText("SPACE SHOOTER GAME",40,260);
    ctx.fillText("Loading...",150,300);
  }

  else if(gameState==="intro"){
    ctx.fillStyle="white";
    ctx.font="26px Arial";
    ctx.fillText("MADE BY ( Abdul Dinh )",50,280);
    ctx.fillText("Click to Start",120,320);
  }

  else if(gameState==="playing"){

    drawStars();

    if(keys["ArrowLeft"]&&player.x>0) player.x-=player.speed;
    if(keys["ArrowRight"]&&player.x<340) player.x+=player.speed;
    if(keys["ArrowUp"]&&player.y>0) player.y-=player.speed;
    if(keys["ArrowDown"]&&player.y<520) player.y+=player.speed;

    ctx.drawImage(shipImage,player.x,player.y,60,80);

    if(shieldActive){
      ctx.strokeStyle="cyan";
      ctx.beginPath();
      ctx.arc(player.x+30,player.y+40,45,0,Math.PI*2);
      ctx.stroke();
      shieldTimer--;
      if(shieldTimer<=0) shieldActive=false;
    }

    // Bullets
    for(let i=bullets.length-1;i>=0;i--){
      let b=bullets[i];
      b.y-=b.speed;
      ctx.fillStyle="yellow";
      ctx.fillRect(b.x,b.y,b.width,b.height);
      if(b.y<0) bullets.splice(i,1);
    }

    // Enemies
    if(Math.random()<0.02+level*0.01&&!bossActive){
      enemies.push({
        x:Math.random()*360,y:-40,
        width:40,height:40,
        speed:3+level*0.5
      });
    }

    for(let i=enemies.length-1;i>=0;i--){
      let e=enemies[i];
      e.y+=e.speed;
      ctx.fillStyle="red";
      ctx.fillRect(e.x,e.y,e.width,e.height);

      if(collision(player,e)&&!shieldActive){
        lives--;
        shakeTime=15; shakePower=8;
        enemies.splice(i,1);
      }

      for(let bi=bullets.length-1;bi>=0;bi--){
        if(collision(bullets[bi],e)){
          explosionSound.currentTime=0;
          explosionSound.play();
          dropPowerUp(e.x,e.y);
          enemies.splice(i,1);
          bullets.splice(bi,1);
          score++;
          break;
        }
      }

      if(e.y>600) enemies.splice(i,1);
    }

    // Powerups
    for(let i=powerUps.length-1;i>=0;i--){
      let p=powerUps[i];
      p.y+=2;
      ctx.fillStyle=p.type==="shield"?"cyan":
                     p.type==="bullet"?"yellow":"pink";
      ctx.fillRect(p.x,p.y,p.width,p.height);

      if(collision(player,p)){
        if(p.type==="shield"){shieldActive=true; shieldTimer=240;}
        if(p.type==="bullet"&&bulletLevel<3) bulletLevel++;
        if(p.type==="life"&&lives<3) lives++;
        powerUps.splice(i,1);
      }
      if(p.y>600) powerUps.splice(i,1);
    }

    // Boss spawn
    if(score>=bossScoreTarget&&!bossActive) spawnBoss();

    if(bossActive&&boss){
      ctx.drawImage(bossImage,boss.x,boss.y,boss.width,boss.height);

      boss.x+=boss.dir*3;
      if(boss.x<=0||boss.x+boss.width>=400) boss.dir*=-1;

      let hpWidth=300*(boss.health/boss.maxHealth);
      ctx.fillStyle="red";
      ctx.fillRect(50,20,300,10);
      ctx.fillStyle="lime";
      ctx.fillRect(50,20,hpWidth,10);

      for(let bi=bullets.length-1;bi>=0;bi--){
        if(!boss) break;
        if(collision(bullets[bi],boss)){
          boss.health-=2;
          bullets.splice(bi,1);
          if(boss.health<=0){
            explosionSound.currentTime=0;
            explosionSound.play();
            boss=null;
            bossActive=false;
            bossScoreTarget+=50;
            if(level<maxLevel){
              gameState="levelComplete";
            }else{
              gameState="finalWin";
            }
            break;
          }
        }
      }
    }

    if(lives<=0){
      gameState="gameover";
      restartBtn.style.display="block";
    }

    if(score>highScore){
      highScore=score;
      localStorage.setItem("spaceHighScore",highScore);
    }

    scoreBoard.innerHTML=
      "Score: "+score+
      " | High: "+highScore+
      "<br>Level: "+level+
      "<br>❤️ ".repeat(lives);
  }

  else if(gameState==="levelComplete"){
    ctx.fillStyle="lime";
    ctx.font="28px Arial";
    ctx.fillText("LEVEL "+level+" COMPLETE!",40,260);
    ctx.fillText("Click for Next Level",60,310);
  }

  else if(gameState==="finalWin"){
    ctx.fillStyle="gold";
    ctx.font="30px Arial";
    ctx.fillText("YOU COMPLETED ALL 10 LEVELS!",10,300);
  }

  else if(gameState==="gameover"){
    ctx.fillStyle="red";
    ctx.font="40px Arial";
    ctx.fillText("GAME OVER",70,300);
  }

  ctx.restore();
  requestAnimationFrame(update);
}

// ================= CLICK =================
canvas.addEventListener("click",()=>{
  if(gameState==="intro") initGame();
  else if(gameState==="levelComplete"){
    level++;
    bossActive=false;
    gameState="playing";
  }
});

restartBtn.addEventListener("click",initGame);

update();
