[3:14 PM] BhaskarSolanke, Anjali
[2:48 PM] Praveen Kumar  G S

import javax.ws.rs.CookieParam;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/")
public class MyResource {        @GET    @Path("login/{userId}/{password}")    public Response login(@PathParam("userId") String uid,             @PathParam("password") String passwd) {

        NewCookie cookie1 = new NewCookie("myLoginCookie", uid);        NewCookie cookie2 = new NewCookie("myPasswordCookie", passwd);        Response.ResponseBuilder rb = Response.ok("Login successful");;        Response response =rb.cookie(cookie1,cookie2).build();

        /*        if (uid.equals("praveen") && passwd.equals("kumar")) {            System.out.println(uid+" "+passwd);            rb = Response.ok("Login successful");

            response = rb.cookie(cookie9,cookie10).build();            System.out.println("Cookies added..");        }        */        return response;    }

    @GET    @Path("balance")    public String getBalance(@Context HttpHeaders headers) {        boolean isLogin=false;        Map<String, Cookie> cookies = headers.getCookies();                for (Map.Entry<String,Cookie> entry : cookies.entrySet()) {            System.out.println(entry.getKey());            /* if(entry.getKey().equals("cookie1")) {                 System.out.println(entry.getKey());                 isLogin=true;                 break;             }*/         }                if (isLogin)            return "The Balance is : " + 1000;        else            return "First login and then check the balance";

    }    

    @GET    @Path("test2")    public String readAllCookies(@Context HttpHeaders headers) {        Map<String, Cookie> cookies = headers.getCookies();        String str = cookies.entrySet()                            .stream()                            .map(e -> e.getKey() + " = " + e.getValue().getValue())                            .collect(Collectors.joining("<br/>"));        return str;    }        /*

    @GET    @Path("test1")    public Response createCookies() {                NewCookie cookie1 = new NewCookie("myStrCookie", "Praveen");        NewCookie cookie2 = new NewCookie("myDateCookie", "2022-08-10");        NewCookie cookie3 = new NewCookie("myIntCookie", "100");                                        Response.ResponseBuilder rb = Response.ok("myStrCookie, "                + "myDateCookie and myIntCookie sent to the browser");               Response response = rb.cookie(cookie1, cookie2, cookie3)                .build();                      return response;    }        @GET    @Path("test2")    public String readAllCookies(@Context HttpHeaders headers) {        Map<String, Cookie> cookies = headers.getCookies();        String str = cookies.entrySet()                            .stream()                            .map(e -> e.getKey() + " = " + e.getValue().getValue())                            .collect(Collectors.joining("<br/>"));        return str;    }                @GET    @Path("test3")    public String readCookie1(@CookieParam("myStrCookie") String strCookie) {        return "myStrCookie value = " + strCookie;    }

    @GET    @Path("test4")    public String readCookie2(@CookieParam("myIntCookie") int intCookie) {        return "myIntCookie value  = " + intCookie;    }

    @GET    @Path("test5")    public String readCookie3(@CookieParam("myIntCookie") BigDecimal bd) {        return "myIntCookie value in BigDecimal = " + bd;    }

    @GET    @Path("test6")    public String readCookie4(@CookieParam("myIntCookie") Long aLong) {        return "myIntCookie  in Long :" + aLong;    }

    @GET    @Path("test7")    public String readCookie5(@CookieParam("myDateCookie") Cookie cookie) {        return "Cookie object :" + cookie;    }

    @GET    @Path("test8")    public String readCookie6(@CookieParam("myDateCookie") LocalDate date) {        return "myDateCookie as LocalDate :" + date;    }

    @GET    @Path("test9")    public Response writeCookies() {        NewCookie cookie1 = new NewCookie("degrees", "BTech");        NewCookie cookie2 = new NewCookie("degrees", "MTech");        Response.ResponseBuilder rb = Response.ok(" Multiple values of myCookie"                + " sent to the browser");        Response response = rb.cookie(cookie1, cookie2)                              .build();        return response;    }

    @GET    @Path("test10")    public String readCookie7(@CookieParam("degrees") List<String> list) {        String rv = "List size: " + list.size() +                "<br/>List values:<br/> ";        rv += list.stream()                  .collect(Collectors.joining("<br/>"));        return rv;    }
*/
 like 1

