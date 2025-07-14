function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.remove();
}

function showSuccessAddCampaignDialog() {
  fetch('/components/dialogs/success-add-campaign.html')
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
    });
}
