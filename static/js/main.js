

// OnLoad Run
window.addEventListener('load', function() {
    switch (window.location.pathname.replace('/gov-self-help', '').toLowerCase()) {
        case '/':
        case '/index.html':
            InitSelfHelpMenu();
            break;

        case '/other-help.html':
            // InitFormListeners();
            // InitFieldListeners();
            SetupFormFieldMasks();
            break;

        default:
            break;
    }
});


function SetupFormFieldMasks() {
    var mask_phone = IMask(
        document.getElementById('phone'), {
            mask: '(000) 000-0000'
        });
}


function InitSelfHelpMenu() {
    Array.from(document.querySelectorAll('.help-topic .topic-header')).forEach((selected_topic) => {
        selected_topic.addEventListener('click', (event) => {
            var open_topic = document.querySelector('.help-topic-expanded');
            if (open_topic) {
                open_topic.classList.remove('help-topic-expanded');
            }

            if (open_topic !== selected_topic.parentElement) {
                selected_topic.parentElement.classList.add('help-topic-expanded');
            }
        });
    });
}


// Forms related functions
function InitFormListeners() {
    if ($('[data-form-submit-target]').length) {
        $('[data-form-submit-target]').each(function() {
            let form_submit_button = $('[data-form-submit-target]');
            let form = $('#' + $(form_submit_button).attr('data-form-submit-target'));
            let form_inputs = $('#' + form.attr('id') + ' input, ' + '#' + form.attr('id') + ' textarea');

            SetupInputListeners(form_inputs);

            $(this).on('click', function(event) {
                EvaluateFormSubmit(form, form_inputs);
            });
        });
    }
    else {
        return;
    }
}

function SetupInputListeners(form_inputs) {
    $(form_inputs).each(function() {
        if ($(this.parentElement).hasClass('form-set-required')) {
            $(this).on('change', function(event) {
                if (this.value !== '') {
                    $(this.parentElement).removeClass('form-set-failed');
                }
            });
        }
    });
}


function EvaluateFormSubmit(form, form_inputs) {
    let form_inputs_evaluated = ValidateFormFields(form_inputs);

    ProcessFormFields(form_inputs_evaluated[0], form_inputs_evaluated[1]);

    if (form_inputs_evaluated[0].length === 0) {
        let form_submit_json_string = BuildFormSubmitJson(form_inputs);
        ProcessFormSubmit(form, form_submit_json_string);
    }
}


function ValidateFormFields(form_inputs) {
    let failed_inputs = [];
    let passed_inputs = [];

    $(form_inputs).each(function() {
        if ($(this.parentElement).hasClass('form-set-required')) {
            if (this.value !== '') {
                passed_inputs.push(this);
            }
            else {
                failed_inputs.push(this);
            }
        }
    });

    return [failed_inputs, passed_inputs];
}


function ProcessFormFields(failed_inputs, passed_inputs) {
    if (failed_inputs.length > 0) {
        failed_inputs[0].focus();
    }

    $(failed_inputs).each(function() {
        $(this.parentElement).addClass('form-set-failed');
    });

    $(passed_inputs).each(function() {
        $(this.parentElement).removeClass('form-set-failed');
    });
}


function BuildFormSubmitJson(form_inputs) {
    let form_value_json = {};

    $(form_inputs).each(function() {
        if (this.type === 'checkbox') {
            form_value_json[this.getAttribute('data-db-field-name')] = this.checked;
        }
        else {
            form_value_json[this.getAttribute('data-db-field-name')] = this.value;
        }
    });

    return JSON.stringify(form_value_json);
}


function ProcessFormSubmit(form, form_submit_json_string) {
    let url = 'https://webapi.mitalent.org/SixtyBy30/SaveJsonLog?JsonLogData=' + encodeURI(form_submit_json_string);

    UpdateFormDisplay(form, 'loading');

    $.ajax({
        type: "POST",
        url: url
    })
        .done(function() {
            UpdateFormDisplay(form, 'success');
        })
        .fail(function() {
            UpdateFormDisplay(form, 'error');
        })
        .always(function() {
            console.log("finished");
        });
}


function UpdateFormDisplay(form, request_status_code) {
    if (request_status_code === 'loading') {
        $('[data-form-loading-target=' + form.attr('id') + ']').addClass('form-loading-show');
    }
    else {
        $('[data-form-loading-target=' + form.attr('id') + ']').removeClass('form-loading-show');

        form.hide();

        if (request_status_code === 'success') {
            $('[data-form-results-target=' + form.attr('id') + ']').addClass('form-results-success');
            $('[data-form-results-target=' + form.attr('id') + '] .results-success').focus();
        }
        else {
            $('[data-form-results-target=' + form.attr('id') + ']').addClass('form-results-fail');
            $('[data-form-results-target=' + form.attr('id') + '] .results-fail').focus();
        }
    }
}



function EvaluateFieldStatus(field) {
    if (field.type !== 'file' && field.type !== 'radio') {
        if (field.value === '') {
            field.parentElement.getElementsByTagName('label')[0].classList.add('formatLabelIsNull');
        }
        else {
            field.parentElement.getElementsByTagName('label')[0].classList.remove('formatLabelIsNull');
            field.classList.remove('inputFailed');
        }
    }

    if (field.type === 'tel') {
        if (field.value !== '') {
            if (field.value.length !== 14) {
                field.classList.add('inputFailed');
            }
            else {
                field.classList.remove('inputFailed');
            }
        }
    }

    if (field.type === 'email') {
        if (field.value !== '') {
            if (CheckEmailRegex(field.value) !== true) {
                field.classList.add('inputFailed');
            }
        }
    }

    if (field.type === 'file') {
        if (field.value !== '') {
            if (field.files[0].size <= fileSizeLimit && ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'].includes(field.files[0].type)) {
                field.classList.remove('inputError');
                field.classList.remove('inputFailed');
            }
            else {
                field.value = '';
                field.classList.add('inputError');
            }
        }
    }

    if (field.type === 'radio') {
        try {
            document.querySelector('input[name="' + field.name + '"]:checked').value;
            field.parentElement.parentElement.parentElement.classList.remove('inputFailed');
        } catch (error) { }
    }
}
function CheckRequiredFields() {
    var failedCount = 0;
    Array.from(document.getElementsByClassName('inputField')).forEach(function (element) {
        if ((!element.classList.contains('requiredInput') && element.value !== '') || element.classList.contains('requiredInput')) {
            if (element.type !== 'file' && element.type !== 'radio') {
                if (element.value === '') {
                    element.parentElement.getElementsByTagName('label')[0].classList.add('formatLabelIsNull');
                    element.classList.add('inputFailed');
                    failedCount += 1;
                }
                else {
                    element.parentElement.getElementsByTagName('label')[0].classList.remove('formatLabelIsNull');
                    element.classList.remove('inputFailed');
                }
            }
            if (element.type === 'tel') {
                if (element.value !== '') {
                    if (element.value.length !== 14) {
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
            }
            if (element.type === 'email') {
                if (element.value !== '') {
                    if (CheckEmailRegex(element.value) !== true) {
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
            }
            if (element.type === 'file') {
                if (element.value !== '') {
                    if (element.files[0].size <= fileSizeLimit && ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'].includes(element.files[0].type)) {
                        element.classList.remove('inputFailed');
                    }
                    else {
                        element.value = '';
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
                else {
                    element.classList.add('inputFailed');
                    failedCount += 1;
                }
            }
            if (element.type === 'radio') {
                try {
                    document.querySelector('input[name="' + element.name + '"]:checked').value;
                    element.parentElement.parentElement.parentElement.classList.remove('inputFailed');
                } catch (error) {
                    element.parentElement.parentElement.parentElement.classList.add('inputFailed');
                    failedCount += 1;
                }
            }
        }
    });

    return failedCount;
}
function CheckEmailRegex(chkEmail) {
    if (chkEmail) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(chkEmail);
    }
    else {
        return null;
    }
}
function initCaptcha() {
    grecaptcha.execute();
    document.getElementById('btnSubmit').classList.add('btnSubmitPending');
    document.getElementById('btnSubmitText').setAttribute('hidden', 'true');
    document.getElementById('btnSubmitLoading').removeAttribute('hidden');
}
function captchaPassed() {
    console.log('reCaptcha returned...');
    if (grecaptcha.getResponse() !== '') {
        console.log('reCaptcha passed!');
        document.getElementById('applicationForm').submit();
    }
    else {
        console.log('reCaptcha failed!');
    }
}