//Handle Scrape button
$("#scrape").on("click", function() {
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function(data) {
        console.log(data)
        window.location = "/"
    })
});

//Set clicked nav option to active
$(".navbar-nav li").click(function() {
   $(".navbar-nav li").removeClass("active");
   $(this).addClass("active");
});

//Handle Save Article button
$(".save").on("click", function() {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/save/" + thisId
    }).done(function(data) {
        window.location = "/"
    })
});

//Handle Delete Article button
$(".delete").on("click", function() {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + thisId
    }).done(function(data) {
        window.location = "/saved"
    })
});

//Handle Save Comments button
$(".saveComments").on("click", function() {
    var thisId = $(this).attr("data-id");
    if (!$("#CommentsText" + thisId).val()) {
        alert("please enter a Comments to save")
    }else {
      $.ajax({
            method: "POST",
            url: "/Commentss/save/" + thisId,
            data: {
              text: $("#CommentsText" + thisId).val()
            }
          }).done(function(data) {
              // Log the response
              console.log(data);
              // Empty the Commentss section
              $("#CommentsText" + thisId).val("");
              $(".modalComments").modal("hide");
              window.location = "/saved"
          });
    }
});

//Handle Delete Comments button
$(".deleteComments").on("click", function() {
    var CommentsId = $(this).attr("data-Comments-id");
    var articleId = $(this).attr("data-article-id");
    $.ajax({
        method: "DELETE",
        url: "/Commentss/delete/" + CommentsId + "/" + articleId
    }).done(function(data) {
        console.log(data)
        $(".modalComments").modal("hide");
        window.location = "/saved"
    })
});
