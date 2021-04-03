////////////////////    Get cards    //////////////////////
let cards = [];
function getAllCards(){
    $("#p-loading").css("display", "block");
    $.ajax({
        type: "POST",
        url: "/profile/get-cards",
        success: function(cards) {
            addCards(cards);
        },
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    });
}
function addCards(cards) {
    $("#p-loading").css("display", "none");
    for(var i=0; i<cards.length; i++){
        $("#div-col-card-create").after(
            getCardHTML(
                cards[i]._id, cards[i].userID, 
                cards[i].title, cards[i].description, 
                cards[i].datetime, 
                cards[i].url)
        );
    }
}
getAllCards();
////////////////////    Name & Bio    //////////////////////
let editable = false;
let previousName = $("#h3-name").text();
$("#input-name").val(previousName);
let previousBio = $("#textarea-bio").val();
if(previousBio === ""){
    $("#textarea-bio").attr("placeholder", "Please fill in a bio");
}
$("#btn-edit-save").click(function(){
    $("#textarea-bio").attr("disabled", editable);
    if(editable) {
        updateNameAndBio(
            getToUpdate(),
            $("#input-name").val(),
            $("#textarea-bio").val()
        );  
    } 
    adjustUI();
    editable = !editable;
});
function adjustUI() {
    if(editable) {
        $("#btn-edit-save").text("Edit");
        $("#input-name").css("display", "none");
        $("#h3-name").css("display", "");
    } else {
        $("#btn-edit-save").text("Save");
        $("#h3-name").css("display", "none");
        $("#input-name").css("display", "");
    }
}
function getToUpdate() {
    let u = "update"
    if(previousName !== $("#input-name").val())
        u += "-name";
    if(previousBio !== $("#textarea-bio").val())
        u += "-bio";
    return u;
}
function updateNameAndBio(toUpdate, name, bio){
    previousName = name;
    $("#input-name").val(previousName);
    $("#h3-name").text(previousName);
    previousBio = bio;
    $.ajax({
        url: "profile/update/"+ toUpdate +"/"+ name +"/"+ bio,
        type: "POST",
        contentType: "application/json",
        success: function(data){}
    });
}

////////////////////    Image Update/Delete    //////////////////////
let imgBtnsDisplayed = false;
$(".img-profile").click(function(){
    if(imgBtnsDisplayed) {
        $("#div-img-btns").css("display", "none");
    } else {
        $("#div-img-btns").css("display", "");
    }
    imgBtnsDisplayed = !imgBtnsDisplayed;
})

$("#btn-img-update").click(function(){
    $("#image").focus().trigger("click");
});

$("#image").change(function(){
    if(!extensionAndSizeChecked()) return;
    console.log($("#image").val());
    $("#form-img-update").trigger("submit");
});

let extension;
function extensionAndSizeChecked(){
    if(!$("#image").val()) {
        alert("Please select a profile picture");
        return false;
    }
    const acceptableExtensions = ["jpeg", "jpg", "png"];
    const imagePath = $("#image").val();
    extension = imagePath.split(".")[imagePath.split(".").length-1];
    if (acceptableExtensions.includes(extension)) {
        const fileSize = $("#image")[0].files[0].size/1024/1024;
        if(fileSize < 5) {
            return true;
        } else {
            alert("Size should not exceed 5 MiB");
            $("#image").val("");
            return false;
        }
    } else {
        alert("Please upload a picture (JPEG, JPG, PNG) exclusively");
        $("#image").val("");
        return false;
    }
}
$("#btn-img-delete").click(function(){
    const c = confirm("Are you sure you want to delete it?");
    if(!c) return;
    $("#form-img-delete").trigger("submit");
}); 
////////////////////    Create card    //////////////////////
let errorMessage, title, description, datetime, url;
$("#btn-card-create").click(()=>{
    getInputs();
    if(!areInputsValid()){
        $("#p-invalid-inputs").text(errorMessage);
        $("#p-invalid-inputs").css("display", "block");
        return;
    } 
    $("#p-invalid-inputs").css("display", "none");
    pushCard();
    emptyInputs();
});
function getInputs(){
    title = $("#input-card-title").val();
    description = $("#textarea-card-description").val();
    datetime = $("#input-card-datetime").val();
    url = $("#input-card-url").val();
}
function areInputsValid() {
    errorMessage = "";
    let errorBool = false;
    if(title == null) {
        errorMessage += "Title: at least 10 characters\n";
        return false;
    } else if(title.length < 10) {
        errorMessage += "Title: at least 10 characters\n";
        errorBool = true;
    }
    
    if(description == null) {
        errorMessage +=  "Description: At least 50 characters\n";
        errorBool = true;
    } else if(description.length < 50) {
        errorMessage +=  "Description: At least 50 characters\n";
        errorBool = true;
    }
    
    if(datetime == null) {
        errorMessage += "Date and time must be selected\n";
        errorBool = true;
    } else if(datetime.length == 0) {
        errorMessage += "Date and time must be selected\n";
        errorBool = true;
    } 
    
    if(url == null) {
        errorMessage += "Link must be specified\n";
        errorBool = true;
    } else if(url.length == 0) {
        errorMessage += "Link must be specified\n";
        errorBool = true;
    }

    return !errorBool;
}
function getCardHTML(cardID, cardUserID, title, description, datetime, url) {
    let card =
    '<div class="col">'+
        '<div class="card div-card-tutorial" style="width: 100%;">'+
            '<span class="card-user-id" style="display:none;">'+cardUserID+'</span>'+
            '<div class="card-header">'+ 
                '<div class="row">'+
                    '<div class="col-9" style="text-align: left">'+
                        datetime +
                    '</div>'+
                    '<div class="col-1">'+
                        '<button id="'+ cardID +'" class="btn btn-outline-danger btn-sm btn-card-delete">delete</button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
            '<div class="card-body">'+
                '<h5 class="card-title">'+ title +'</h5>'+
                '<p class="card-text">'+ 
                    description +
                '</p>'+
            '</div>'+
            '<div class="card-footer">'+ 
                '<a href="//'+url+'" class="card-link" target="_blank" rel="noopener noreferrer" style="text-decoration: none"> Link </a>'+
            '</div>'+
        '</div>'+
    '</div>';

    return card;
}
function pushCard() {
    const newCard = {
        title: title,
        description: description,
        datetime: datetime,
        url: url
    };
    pushCardToDB(newCard);
    cards.push(newCard);
}
function pushCardToDB(newCard) {
    $("#p-loading").css("display", "block");
    $.ajax({
        type: "POST",
        url: "/profile/create-card",
        data: newCard,
        success: function (IDs) {
            $("#p-loading").css("display", "none");
            $("#div-col-card-create").after(
                getCardHTML(IDs.cardID, IDs.cardUserID, title, description, datetime, url)
            );
            title=""; description=""; datetime=""; url="";
        },
        error: function (xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    });
}
function emptyInputs(){
    $("#input-card-title").val("");
    $("#textarea-card-description").val("");
    $("#input-card-datetime").val("");
    $("#input-card-url").val("");
}
////////////////////    Delete card    //////////////////////
$(document).on("click", ".btn-card-delete", function(){
    const c = confirm("Are you sure you want to delete it?");
    if(!c) return;
    const id = $(this).attr("id");
    $(this).parent().parent().parent().parent().parent().remove();
    $.ajax({
        type: "POST",
        url: "/profile/delete-card/"+id,
        success: function() {},
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    }); 
});




