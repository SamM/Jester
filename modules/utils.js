module.exports = function(){
  this.formatMsg = function(msg){
    try{
        // bold
      msg = msg.replace(/&b\t/g,	"<b>" );
      msg = msg.replace(/&\/b\t/g,"</b>");
        // italic
      msg = msg.replace(/&i\t/g,	"<i>" );
      msg = msg.replace(/&\/i\t/g,"</i>");
        // underline
      msg = msg.replace(/&u\t/g,	"<u>" );
      msg = msg.replace(/&\/u\t/g,"</u>");
        // strike
      msg = msg.replace(/&s\t/g,	"<s>") ;
      msg = msg.replace(/&\/s\t/g,"</s>");
        // paragraph
      msg = msg.replace(/&p\t/g,	"<p>" );
      msg = msg.replace(/&\/p\t/g,"</p>");
        // break
      msg = msg.replace(/&br\t/g,"<br/>");
        //li
      msg = msg.replace(/&li\t/g,	 "<li>" );
      msg = msg.replace(/&\/li\t/g,"</li>");
        //ul
      msg = msg.replace(/&ul\t/g,	 "<ul>" );
      msg = msg.replace(/&\/ul\t/g,"</ul>");
        //ol
      msg = msg.replace(/&ol\t/g,	 "<ol>" );
      msg = msg.replace(/&\/ol\t/g,"</ol>");
        // subscript
      msg = msg.replace(/&sub\t/g,	"<sub>" );
      msg = msg.replace(/&\/sub\t/g,	"</sub>");
        // superscript
      msg = msg.replace(/&sup\t/g,	"<sup>" );
      msg = msg.replace(/&\/sup\t/g,	"</sup>");
        // code
      msg = msg.replace(/&code\t/g,	"<code>" );
      msg = msg.replace(/&\/code\t/g, "</code>");
        // bcode
      msg = msg.replace(/&bcode\t/g,	"<bcode>" );
      msg = msg.replace(/&\/bcode\t/g,"</bcode>");
    // deviant
      msg = msg.replace(/&dev\t([^\t])\t([^\t]+)\t/g,':dev$2:');
        // link no description
      msg = msg.replace(/&link\t([^\t]+)\t&/g,'$1');
        // link with description
      msg = msg.replace(/&link\t([^\t]+)\t([^\t]+)\t&\t/g,'$1 \($2\)');
        // abbr
      msg = msg.replace(/&abbr\t([^\t]+)\t/g,'<abbr title="$1">');
      msg = msg.replace(/&\/abbr\t/g,"</abbr>");
        // acronym
      msg = msg.replace(/&acro\t([^\t]+)\t/g,'<acronym title="$1">');
      msg = msg.replace(/&\/acro\t/g,"</acronym>");
        // anchor
      msg = msg.replace(/&a\t([^\t]+)\t([^\t]*)\t/g,'<a href="$1" title="$2">');
        // avatar
      msg = msg.replace(/&avatar\t([^\t]+)\t([^\t]+)\t/g,':icon$1:');
        // img
          msg = msg.replace(/&img\t([^\t]+)\t([^\t]*)\t([^\t]*)\t/g,'<image src="$1" />');
      msg = msg.replace(/&\/a\t/g,"</a>");
    // emote
      msg = msg.replace(/&emote\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t/g,'$1');
        // iframe
          msg = msg.replace(/&iframe\t([^\t]+)\t([^\t]*)\t([^\t]*)\t/g,'<iframe href="$1" height="$2" width="$3" />');
        // thumbnail
      msg = msg.replace(/&thumb\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t/g,':thumb$1:');
    }catch(ex){}
    return msg;
  };
}
