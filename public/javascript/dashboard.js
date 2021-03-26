$("#input-search").on("input", ()=>{
    const searchQuery = $("#input-search").val();
    if(searchQuery == null) {
        adjustUI(0);
        return;
    } else if(searchQuery == "") {
        adjustUI(0);
        return;
    }
    sendQueryToServer(searchQuery);
});
function sendQueryToServer(searchQuery){
    $.ajax({
        type: "POST",
        url: "/dashboard/search/"+ searchQuery,
        success: function(results) {
            adjustUI(results.length);
            addCards(results);
        },
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        }
    });
}
function addCards(cards){
    for(var i=0; i<cards.length; i++){
        $("#hidden-col").after(
            getCardHTML(
                cards[i].userID, cards[i].userName,
                cards[i].title, cards[i].description, 
                cards[i].datetime, cards[i].url)
        );
        getProfilePhoto(cards[i].userID);
    }
}
function getCardHTML(cardUserID, cardUserName, title, description, datetime, url) {
    let card =
    '<div class="col col-added">'+
        '<div>'+
            '<img class='+ cardUserID +' src="/images/profile-placeholder.png" style="border-radius: 50%; height: 50px; width: 50px; float: left; margin: 0 5px">'+
            '<h6 class="'+ cardUserID +'" style="height: 50px; padding: 15px 0;">'+ cardUserName +'</h6>'+
        '</div>'+
        '<form class="form-'+ cardUserID +'" action="/dashboard/visit-profile/'+ cardUserID +'" method="post" style="display: none"></form>'+
        '<div class="card div-card-tutorial" style="width: 100%;">'+
            '<div class="card-header">'+ datetime +'</div>'+
            '<div class="card-body">'+
                '<h5 class="card-title">'+ title +'</h5>'+
                '<p class="card-text">'+ 
                    description +
                '</p>'+
            '</div>'+
            '<div class="card-footer">'+ 
                '<a href="'+url+'" class="card-link" target="_blank" rel="noopener noreferrer" style="text-decoration: none"> Link </a>'+
            '</div>'+
        '</div>'+
    '</div>';

    return card;
}
function adjustUI(length){
    $(".col-added").remove();
    if(length == 0) {
        $("#p-no-results").css("display", "block");
    } else {
        $("#p-no-results").css("display", "none");
    }
}
function getProfilePhoto(userID){
    $.ajax({
        type: "POST",
        url: "/dashboard/get-profile-photo/"+ userID,
        success: function(src) {
            $("img."+userID).attr("src", src);
        },
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        }
    });
}
$(document).on("click", "h6", function(){
    const cardUserID = $(this).attr("class");
    $(".form-"+cardUserID).submit();
});