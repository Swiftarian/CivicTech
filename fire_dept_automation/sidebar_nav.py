# -*- coding: utf-8 -*-
import streamlit as st

def render_chinese_sidebar():
    st.markdown("""<style>[data-testid="stSidebarNav"] {display: none;}</style>""", unsafe_allow_html=True)
    st.sidebar.title(" 系統導覽")
    st.sidebar.divider()
    if st.sidebar.button(" 首頁", use_container_width=True): st.switch_page("home.py")
    if st.sidebar.button(" 防災館參館預約", use_container_width=True): st.switch_page("pages/1_disaster_prevention_museum_booking.py")
    if st.sidebar.button(" 社區互助送餐", use_container_width=True): st.switch_page("pages/2_community_meal_delivery.py")
    if st.sidebar.button(" 民眾申辦與查詢", use_container_width=True): st.switch_page("pages/3_public_application_and_inquiry.py")
    if st.sidebar.button(" 案件審核", use_container_width=True): st.switch_page("pages/4_case_review.py")
    if st.sidebar.button(" 申報書比對系統", use_container_width=True): st.switch_page("pages/5_auto_comparison_system.py")
    st.sidebar.divider()
