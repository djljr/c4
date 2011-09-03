import org.scalatra._
import java.net.URL
import scalate.ScalateSupport

class C4 extends ScalatraFilter with ScalateSupport {
  
  get("/") {
    <html>
        <head>
            <title>C4: A Yodle Challenge</title>
            <script type="text/javascript" src="js/jquery-1.6.2.js"></script>
            <script type="text/javascript" src="js/jquery.gamequery-0.5.1.js"></script>
            <script type="text/javascript" src="js/c4.js"></script>
        </head>
        <body>
            <div id="gameboard"></div>
        </body>
    </html>
  }
}
