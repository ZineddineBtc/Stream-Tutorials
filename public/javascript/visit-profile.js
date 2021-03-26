const profileID = $("#span-profileID").text();
console.log("profileID: "+profileID);
getProfileCards();

function getProfileCards() {
    $.ajax({
        type: "POST",
        url: "/visit-profile/get-cards/"+ profileID,
        success: function(cards) {
            if(cards.length==0){
                $("#h5-no-cards").css("display", "block");
            } else {
                $("#h5-no-cards").css("display", "none");
                addCards(cards);
            }
        },
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        }
    });
}
function addCards(cards) {
    for(var i=0; i<cards.length; i++){
        $("#hidden-col").after(
            getCardHTML(
                cards[i].title, cards[i].description, 
                cards[i].datetime, 
                cards[i].url)
        );
    }
}
function getCardHTML(title, description, datetime, url) {
    let card =
    '<div class="col col-added">'+
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