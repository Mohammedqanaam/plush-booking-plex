# دليل الإعداد الكامل: ChatGPT + n8n + GitHub + Netlify

هذا الدليل يشرح إعداد نظام تشغيل تلقائي لتنفيذ أوامر إدارة المشروع (إنشاء/تعديل/حذف ملفات، دمج فروع، نشر Netlify) من خلال ChatGPT عبر n8n.

## 1) إعداد GitHub داخل n8n

### معلومات المستودع
- **Repository Owner**: `Mohammedqanaam`
- **Repository Name**: `plush-booking-plex`

### Nodes المطلوب تحديثها
ضع القيم السابقة في كل GitHub Node التالية:
- `Create/Update File in GitHub`
- `Delete File from GitHub`
- `Merge Branches in GitHub`
- `Get Repository Info`

---

## 2) إعداد Netlify داخل n8n

### الحصول على Site ID
1. افتح Netlify: <https://app.netlify.com>
2. اختر الموقع: `res-dashbord`
3. انتقل إلى: **Site settings → General**
4. انسخ **Site ID**

### ربط Site ID داخل n8n
- افتح Node: `Deploy to Netlify`
- ألصق **Site ID** في الحقل المخصص.

---

## 3) إعداد Webhook

### عنوان الـ Webhook
```http
POST https://mohammedaldosari.app.n8n.cloud/webhook/6864d1db-aa58-41da-a32c-53258b29d1fd
Content-Type: application/json
```

### مثال Body متوافق مع Actions
```json
{
  "action": "create_file",
  "file_path": "test.txt",
  "content": "Hello World",
  "commit_message": "Create test file",
  "branch": "main"
}
```

### قيم `action` المدعومة
- `create_file`
- `update_file`
- `delete_file`
- `merge_branches`
- `deploy`

> ملاحظة: قبل الاختبار من n8n اضغط **Listen for test event**.

---

## 4) إنشاء Custom GPT (موصى به)

1. افتح ChatGPT على المتصفح: <https://chat.openai.com>
2. من القائمة الجانبية: **Explore GPTs**
3. اضغط **Create** ثم تبويب **Configure**

### الحقول الأساسية
- **Name**: `GitHub & Netlify Manager`
- **Description**: `مساعد لإدارة مشاريع GitHub ونشرها على Netlify من خلال المحادثة`

### Instructions (جاهزة للنسخ)
```text
أنت مساعد متخصص في إدارة مشاريع GitHub و Netlify.

المهام التي يمكنك القيام بها:
1. إنشاء ملفات جديدة في GitHub
2. تعديل ملفات موجودة
3. حذف ملفات
4. دمج الفروع (merge branches)
5. نشر التحديثات على Netlify

عندما يطلب المستخدم أي من هذه المهام:
- اسأل عن التفاصيل المطلوبة (اسم الملف، المحتوى، رسالة الـ commit، إلخ)
- استخدم الـ action المناسب
- أكد نجاح العملية للمستخدم

الـ actions المتاحة:
- create_file: لإنشاء ملف جديد
- update_file: لتعديل ملف موجود
- delete_file: لحذف ملف
- merge_branches: لدمج فرعين
- deploy: لنشر على Netlify

دائماً تحدث بالعربية مع المستخدم.
```

### إضافة Action Schema
داخل Configure → **Actions** → **Create new action**:
- **Authentication**: `None`
- **Schema**: الصق OpenAPI التالي:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "GitHub & Netlify Manager",
    "description": "إدارة مشاريع GitHub ونشرها على Netlify",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://mohammedaldosari.app.n8n.cloud"
    }
  ],
  "paths": {
    "/webhook/6864d1db-aa58-41da-a32c-53258b29d1fd": {
      "post": {
        "operationId": "executeCommand",
        "summary": "تنفيذ أوامر GitHub و Netlify",
        "description": "إنشاء، تعديل، حذف ملفات، دمج فروع، أو النشر على Netlify",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["action"],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": ["create_file", "update_file", "delete_file", "merge_branches", "deploy"],
                    "description": "نوع العملية المطلوبة"
                  },
                  "file_path": {
                    "type": "string",
                    "description": "مسار الملف (مثل: src/index.html)"
                  },
                  "content": {
                    "type": "string",
                    "description": "محتوى الملف (للإنشاء أو التعديل)"
                  },
                  "commit_message": {
                    "type": "string",
                    "description": "رسالة الـ commit"
                  },
                  "branch": {
                    "type": "string",
                    "description": "اسم الفرع (افتراضي: main)",
                    "default": "main"
                  },
                  "source_branch": {
                    "type": "string",
                    "description": "الفرع المصدر (للدمج)"
                  },
                  "target_branch": {
                    "type": "string",
                    "description": "الفرع الهدف (للدمج)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "تم تنفيذ الأمر بنجاح",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "description": "حالة النجاح"
                    },
                    "message": {
                      "type": "string",
                      "description": "رسالة النتيجة"
                    },
                    "data": {
                      "type": "object",
                      "description": "بيانات إضافية"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

بعدها:
1. اضغط **Save** ثم **Update**
2. احفظ الـ GPT مع مستوى الوصول المناسب (`Only me` أو `Anyone with a link`).

---

## 5) اختبار النظام

### اختبارات مقترحة
1. **create_file**: إنشاء `test.html`
2. **update_file**: تعديل `README.md`
3. **delete_file**: حذف `test.html`
4. **deploy**: تنفيذ نشر على Netlify

### المراقبة
- من n8n افتح **Executions** وتحقق أن التنفيذ أخضر ✅.

---

## 6) Checklist سريع

### في n8n
- [ ] Repository Owner/Name محدث في كل GitHub nodes
- [ ] Site ID مضاف في Netlify node
- [ ] Workflow مفعّل
- [ ] ضغطت Listen for test event قبل اختبار webhook

### في ChatGPT
- [ ] تم إنشاء Custom GPT
- [ ] تم إضافة Action schema
- [ ] تم حفظ GPT وتجربته

### في GitHub/Netlify
- [ ] Token الصلاحيات صحيحة
- [ ] اسم المستودع صحيح
- [ ] Netlify مربوط بنفس المستودع
