from apps.authentication.utils import mask_email


def test_mask_email_keeps_domain():
    assert mask_email('a.user@company.org').endswith('@company.org')
