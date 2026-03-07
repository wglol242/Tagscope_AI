// src/helpers/downloadHelper.js

export const downloadData = (bookmarks) => {
  if (!bookmarks || bookmarks.length === 0) {
    alert('No bookmarks available to download.');
    return;
  }

  const htmlRows = bookmarks
    .map(
      (bookmark) =>
        `    <DT><A HREF="${bookmark.link}" ADD_DATE="${Math.floor(
          Date.now() / 1000
        )}">${bookmark.summary || bookmark.link}</A>`
    )
    .join('\n');

  const data = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3 ADD_DATE="${Math.floor(
    Date.now() / 1000
  )}" LAST_MODIFIED="0">Tagscope AI</H3>
  <DL><p>
${htmlRows}
  </DL><p>
</DL><p>`;

  const blob = new Blob([data], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookmarks.html";
  a.click();
  URL.revokeObjectURL(url);
};
