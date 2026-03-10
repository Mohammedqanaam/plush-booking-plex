# Netlify Deploy Key Setup (for private submodules/dependencies)

> مهم: **لا** تضف المفتاح الخاص داخل المستودع أبدًا.

إذا كان البناء في Netlify يحتاج الوصول إلى Submodule أو dependency خاصة عبر SSH:

1. أضف المفتاح الخاص في Netlify كمتغير بيئة باسم:
   - `NETLIFY_DEPLOY_KEY`
2. صيغة المفتاح تكون كاملة كما هي (multiline)، مثال يبدأ بـ:
   - `ssh-rsa AAAA...`
3. البناء يستخدم سكربت:
   - `scripts/netlify-setup-ssh.sh`

السكربت يقوم بـ:
- إنشاء `~/.ssh/id_rsa`
- ضبط الصلاحيات الآمنة للملفات
- إضافة `github.com` إلى `known_hosts`
- تفعيل المفتاح في `~/.ssh/config`

تم ربط السكربت قبل أمر البناء داخل `netlify.toml`.
