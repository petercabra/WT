/*
 * Created by Stefan Korecko, 2020
 * Form processing functionality
 */


function processOpnFrmData(event){
    //1.prevent normal event (form sending) processing
    event.preventDefault();

    //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
    const nopMeno = document.getElementById("nameElm").value.trim();
    const nopMail = document.getElementById("emailElm").value.trim();
    const nopOpn = document.getElementById("opnElm").value.trim();
    const nopLike = document.getElementById("like").checked;
    const nopEdoprava = document.getElementById("edoprava").checked;
    const nop3DTlac = document.getElementById("tlac").checked;
    //3. Verify the data
    if(nopMeno=="" || nopOpn=="" || nopMail==""){
        window.alert("!!!!Prosím, vyplňte všetky povinné polia!!!!");
        return;
    }

    //3. Add the data to the array opinions and local storage
    const newOpinion =
        {
            name: nopMeno,
            email: nopMail,
            comment: nopOpn,
            like: nopLike,
            edoprava: nopEdoprava,
            tlac: nop3DTlac,
            created: new Date()

        };


    let opinions = [];

    if(localStorage.myComments){
        opinions=JSON.parse(localStorage.myComments);
    }

    opinions.push(newOpinion);

    localStorage.myComments = JSON.stringify(opinions);

    //5. Go to the opinions
    window.location.hash="#opinions";

}
