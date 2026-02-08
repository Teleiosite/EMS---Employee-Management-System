from apps.authentication.utils import mask_email


def test_mask_email_obfuscates_local_part():
    assert mask_email('john.doe@example.com') == 'jo***@example.com'
