//an array, defining the routes

export default[

    {

        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"articles",
        //the function that returns content to be rendered to the target html element:
        getTemplate:createHtml4Welcome
    },
    {
        hash:"commSend",
        target:"articles",
        getTemplate: addNewAComment
    },
    {
        hash:"articles",
        target:"articles",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"footer",
        target:"footer",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"opinions",
        target:"articles",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"articles",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    },
    {
        hash:"article",
        target:"articles",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"articles",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"articles",
        getTemplate: deleteArticle
    },
    {
        hash:"artInsert",
        target:"articles",
        getTemplate: (targetElm) => {
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addArticle").innerHTML
            document.getElementsByClassName("active")[0].className = "";
            document.getElementById("insert").className = "active";
        }
    }


];
const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;
function createHtml4Welcome(targetElm) {
    document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML;
    const footersElm = document.getElementById("footer");
    footersElm.innerHTML=Mustache.render(document.getElementById("template-footer-empty").innerHTML);
}
// function createHtml4Opinions(targetElm) {
//     document.getElementById(targetElm).innerHTML = document.getElementById("template-opinions").innerHTML;
//     const footersElm = document.getElementById("footer");
//     footersElm.innerHTML=Mustache.render(document.getElementById("template-footer-empty").innerHTML);
// }
function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myComments;
    let opinions=[];
    document.getElementById(targetElm).innerHTML = document.getElementById("template-opinions").innerHTML;
    const footersElm = document.getElementById("footer");
    footersElm.innerHTML=Mustache.render(document.getElementById("template-footer-empty").innerHTML);

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"":"Stránka sa mi páči.";
            opinion.edoprava = opinion.edoprava?"Mam záujem o E-Dopravu":"";
            opinion.tlac = opinion.tlac?"Mam záujem o E3D Tlač":"";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}
function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash){

    let articleList =[];
    let totalCountFromMeta;
    let offsetFromMeta;

    const offset=Number(offsetFromHash);
    const totalCount=Number(totalCountFromHash);
    console.log(offsetFromHash);
    console.log(totalCountFromHash);

    let tmpHtmlElm2CreatePreview = document.createElement("div");
    let urlQuery = "";
    const previewStringLenght=20;

    if (offset && totalCount){
        urlQuery=`?tag=Pjotrov&offset=${offset}&max=${articlesPerPage}`; //?tag=Pjotrov
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }
    console.log(urlQuery);

    const url = `${urlBase}/article${urlQuery}`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            articleList = responseJSON.articles;
            totalCountFromMeta = Number(responseJSON.meta.totalCount);
            offsetFromMeta = Number(responseJSON.meta.offset);
            console.log(responseJSON);
            console.log(totalCountFromMeta);
            console.log(offsetFromMeta);
            return Promise.resolve();

        })
        .then(() => {
            let prrt;
            let cntRequests = articleList.map(
                article => fetch(`${urlBase}/article/${article.id}`)
            );
            return Promise.all(cntRequests);
        })
        .then(responses => {
            let failed = "";
            for (let response of responses) {
                if (!response.ok) {
                    failed += response.url + " ";
                }
            }
            if (failed === "") {
                return responses;
            } else {
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}`))
            }

        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{

                //create the content preview string and add it to the article object in the articleList
                tmpHtmlElm2CreatePreview.innerHTML=article.content;
                articleList[index].contentPrev=tmpHtmlElm2CreatePreview.textContent.substring(0,previewStringLenght)+"...";
                articleList[index].totalCount=totalCountFromMeta-1;
                articleList[index].currPage=index+offsetFromMeta;
                if(offsetFromMeta>20){
                    articleList[index].prevPage=offsetFromMeta-20;
                }
                if(offsetFromMeta<totalCountFromMeta){
                    articleList[index].nextPage=offsetFromMeta+20;
                }
                console.log(articleList[index].totalCount,articleList[index].currPage );

            });
            console.log(JSON.parse(JSON.stringify(articleList)));
            return Promise.resolve()
        })
        .then(() => {
            renderArticles(targetElm, articleList); // funkcia pre vpisanie do sablony...
        })
        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}

function renderArticles(targetElm, articles) {
    const articlesElm = document.getElementById("articles");
    articlesElm.innerHTML=Mustache.render(document.getElementById("template-articles").innerHTML, articles);
    const footersElm = document.getElementById("footer");
    footersElm.innerHTML=Mustache.render(document.getElementById("template-footer").innerHTML, articles[19]);

}

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}
function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}
function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    let clanok;
    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if(forEdit){
                responseJSON.formTitle="Article \"" + responseJSON.title + "\" - edit";
                responseJSON.formSubmitCall = `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;
                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
                console.log(responseJSON);
                if(responseJSON.tags){
                    let idx = responseJSON.tags.indexOf("Pjotrov");
                    console.log(idx);
                    if(idx > -1) responseJSON.tags.splice(idx, 1);
                }
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                clanok = responseJSON;
            }else{
                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.addCommLink=`#commSend/${responseJSON.id}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                clanok = responseJSON;
            }
        })
        .then( () => {
            return fetch(`${url}/comment`)
        })
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then((responseJSON) => {
            clanok.comments = responseJSON.comments;
            if(!forEdit) {
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        clanok
                    );
            }
        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}
function deleteArticle(targetElm, artIdFromHash) {
    const deleteReqSettings =
        {
            method: 'DELETE'
        };
    document.getElementById(targetElm).innerHTML=`<p>Attempting to delete article with id=${artIdFromHash}<br />... <br /> <br /></p>`;
    fetch(`${urlBase}/article/${artIdFromHash}`, deleteReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                window.alert("Article successfully deleted."); //no response this time, so we end here
                window.location.hash=`#articles`;
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .catch(error => { ////here we process all the failed promises
            outpElm.innerHTML+=`Attempt failed. Details: <br />  ${error}`;
        });
}
function addNewAComment(targetElm, artIdFromHash) {
    const newCommData = {
        text: document.getElementById("commentAdd").value.trim(),
        author: document.getElementById("commentAuthor").value.trim(),
    };

    if (!(newCommData.text && newCommData.author)) {
        window.alert("Please, enter article title and content");
        return;
    }
    const postReqSettings = //an object wih settings of the request
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(newCommData)
        };
    fetch(`${urlBase}/article/${artIdFromHash}/comment`, postReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                return response.json(); //we return a new promise with the response data in JSON to be processed
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => { //here we process the returned response data in JSON ...
            window.location.hash=`#article/${artIdFromHash}`;
        })
        .catch(error => { ////here we process all the failed promises
            window.alert("Error adding comment to the server!");
            window.location.hash=`#article/${artIdFromHash}`;
        });
}
