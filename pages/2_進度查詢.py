import streamlit as st
import db_manager

st.set_page_config(page_title="進度查詢 - 消防安全設備檢修申報", page_icon="🔍")

# 載入自定義 CSS
import utils
utils.load_custom_css()

st.title("🔍 案件進度查詢")

tab1, tab2 = st.tabs(["🔢 依單號查詢", "📧 依 Email 查詢"])

with tab1:
    case_id_input = st.text_input("請輸入案件單號", placeholder="例如：a1b2c3d4")
    if st.button("查詢單號"):
        if case_id_input:
            case = db_manager.get_case_by_id(case_id_input)
            if case:
                st.success("✅ 查詢成功")
                st.markdown(f"""
                **案件單號**: `{case['id']}`
                **申請人**: {case['applicant_name']}
                **目前狀態**: :red[{case['status']}]
                **申請日期**: {case['submission_date']}
                """)
                
                if case['review_notes']:
                    st.info(f"📋 **審核備註**: {case['review_notes']}")
            else:
                st.error("❌ 找不到此單號，請確認輸入是否正確。")

with tab2:
    email_input = st.text_input("請輸入申請 Email", placeholder="example@email.com")
    if st.button("查詢 Email"):
        if email_input:
            cases = db_manager.get_cases_by_email(email_input)
            if cases:
                st.success(f"✅ 找到 {len(cases)} 筆案件")
                for case in cases:
                    with st.expander(f"{case['submission_date']} - {case['status']}"):
                        st.markdown(f"""
                        **案件單號**: `{case['id']}`
                        **申請人**: {case['applicant_name']}
                        **目前狀態**: :red[{case['status']}]
                        """)
                        if case['review_notes']:
                            st.write(f"📋 **審核備註**: {case['review_notes']}")
            else:
                st.warning("查無此 Email 的相關案件。")
